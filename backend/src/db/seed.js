// src/db/seed.js
// Creates a default admin user for first login. Change the password immediately after.
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  try {
    const email = 'admin@cryptotrace.local';
    const plainPassword = 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('ℹ️  Admin user already exists, skipping seed.');
      process.exit(0);
    }

    await pool.query(
      `INSERT INTO users (uuid, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), 'System Admin', email, passwordHash, 'admin']
    );

    console.log('✅ Default admin created:');
    console.log(`   email: ${email}`);
    console.log(`   password: ${plainPassword}`);
    console.log('   ⚠️  Change this password immediately after first login.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
