// src/controllers/adminController.js
const { pool } = require('../config/db');

async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, uuid, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, req.params.id]);
    res.json({ success: true, message: 'User status updated' });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['admin', 'investigator'].includes(role)) {
      return res.status(422).json({ success: false, message: 'Invalid role' });
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true, message: 'User role updated' });
  } catch (err) {
    next(err);
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const [[{ totalTransactions }]] = await pool.query('SELECT COUNT(*) AS totalTransactions FROM transactions');
    const [[{ totalWallets }]] = await pool.query('SELECT COUNT(*) AS totalWallets FROM wallets');
    const [[{ highRiskWallets }]] = await pool.query(`SELECT COUNT(*) AS highRiskWallets FROM risk_analysis WHERE risk_level = 'high'`);
    const [[{ totalVolumeUsd }]] = await pool.query('SELECT COALESCE(SUM(amount_usd),0) AS totalVolumeUsd FROM transactions');
    const [riskDistribution] = await pool.query('SELECT risk_level, COUNT(*) AS count FROM risk_analysis GROUP BY risk_level');
    const [chainDistribution] = await pool.query('SELECT chain, COUNT(*) AS count FROM wallets GROUP BY chain');

    res.json({
      success: true,
      data: { totalTransactions, totalWallets, highRiskWallets, totalVolumeUsd, riskDistribution, chainDistribution }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUserStatus, updateUserRole, getDashboardStats };
