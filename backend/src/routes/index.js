// src/routes/index.js
const express = require('express');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');

const authRoutes = require('./authRoutes');
const walletRoutes = require('./walletRoutes');
const graphRoutes = require('./graphRoutes');
const assistantRoutes = require('./assistantRoutes');
const reportRoutes = require('./reportRoutes');
const investigationRoutes = require('./investigationRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authLimiter, authRoutes);
router.use('/wallets', apiLimiter, walletRoutes);
router.use('/graph', apiLimiter, graphRoutes);
router.use('/assistant', apiLimiter, assistantRoutes);
router.use('/reports', apiLimiter, reportRoutes);
router.use('/investigations', apiLimiter, investigationRoutes);
router.use('/admin', apiLimiter, adminRoutes);

router.get('/health', (req, res) => res.json({ success: true, message: 'CryptoTrace AI API is running' }));

module.exports = router;
