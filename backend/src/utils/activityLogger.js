// src/utils/activityLogger.js
const { pool } = require('../config/db');

async function logActivity(userId, action, details = {}, ipAddress = null) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
      [userId, action, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    // Logging failures should never break the main request flow
    console.error('⚠️  Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity };
