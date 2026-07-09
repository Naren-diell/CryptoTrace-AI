// src/server.js
require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

testConnection();

app.listen(PORT, () => {
  console.log(`🚀 CryptoTrace AI backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
