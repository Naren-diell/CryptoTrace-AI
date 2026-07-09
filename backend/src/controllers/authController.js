// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/token');
const { logActivity } = require('../utils/activityLogger');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userUuid = uuidv4();
    // Only allow self-registration as investigator; admins must be promoted manually or by another admin.
    const safeRole = role === 'admin' ? 'investigator' : (role || 'investigator');

    const [result] = await pool.query(
      `INSERT INTO users (uuid, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [userUuid, name, email, passwordHash, safeRole]
    );

    const user = { id: result.insertId, uuid: userUuid, email, role: safeRole };
    const token = generateToken(user);

    await logActivity(user.id, 'USER_REGISTER', { email }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user: { id: user.id, name, email, role: safeRole } }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    await logActivity(user.id, 'USER_LOGIN', { email }, req.ip);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, uuid, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getCurrentUser };
