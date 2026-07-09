// src/routes/reportRoutes.js
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { generateReport, downloadReport } = require('../controllers/reportController');

const router = express.Router();

router.post(
  '/generate',
  authenticate,
  [
    body('investigationId').isInt().withMessage('investigationId is required'),
    body('reportType').isIn(['investigation_summary', 'transaction_flow', 'wallet_risk', 'end_receiver', 'timeline']),
    body('format').isIn(['pdf', 'xlsx'])
  ],
  validate,
  generateReport
);

router.get('/download/:fileName', authenticate, downloadReport);

module.exports = router;
