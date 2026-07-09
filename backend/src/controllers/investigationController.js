// src/controllers/investigationController.js
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

async function createInvestigation(req, res, next) {
  try {
    const { title, description, caseType } = req.body;
    const investigationUuid = uuidv4();

    const [result] = await pool.query(
      `INSERT INTO investigations (uuid, title, description, case_type, created_by) VALUES (?, ?, ?, ?, ?)`,
      [investigationUuid, title, description || null, caseType || 'other', req.user.id]
    );

    await logActivity(req.user.id, 'INVESTIGATION_CREATE', { title }, req.ip);

    res.status(201).json({ success: true, data: { id: result.insertId, uuid: investigationUuid, title } });
  } catch (err) {
    next(err);
  }
}

async function listInvestigations(req, res, next) {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin
      ? `SELECT i.*, u.name AS created_by_name FROM investigations i JOIN users u ON u.id = i.created_by ORDER BY i.created_at DESC`
      : `SELECT i.*, u.name AS created_by_name FROM investigations i JOIN users u ON u.id = i.created_by WHERE i.created_by = ? ORDER BY i.created_at DESC`;
    const params = isAdmin ? [] : [req.user.id];

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getInvestigation(req, res, next) {
  try {
    const [[investigation]] = await pool.query('SELECT * FROM investigations WHERE id = ?', [req.params.id]);
    if (!investigation) return res.status(404).json({ success: false, message: 'Investigation not found' });

    if (req.user.role !== 'admin' && investigation.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [wallets] = await pool.query('SELECT * FROM wallets WHERE investigation_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...investigation, wallets } });
  } catch (err) {
    next(err);
  }
}

async function updateInvestigationStatus(req, res, next) {
  try {
    const { status } = req.body;
    await pool.query('UPDATE investigations SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createInvestigation, listInvestigations, getInvestigation, updateInvestigationStatus };
