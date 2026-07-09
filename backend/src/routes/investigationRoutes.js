// src/routes/investigationRoutes.js
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  createInvestigation,
  listInvestigations,
  getInvestigation,
  updateInvestigationStatus
} = require('../controllers/investigationController');

const router = express.Router();

router.post(
  '/',
  authenticate,
  [body('title').trim().notEmpty().withMessage('title is required')],
  validate,
  createInvestigation
);

router.get('/', authenticate, listInvestigations);
router.get('/:id', authenticate, getInvestigation);

router.patch(
  '/:id/status',
  authenticate,
  [body('status').isIn(['open', 'in_progress', 'closed'])],
  validate,
  updateInvestigationStatus
);

module.exports = router;
