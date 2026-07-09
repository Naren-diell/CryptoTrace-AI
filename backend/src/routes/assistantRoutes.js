// src/routes/assistantRoutes.js
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { chat } = require('../controllers/assistantController');

const router = express.Router();

router.post(
  '/chat',
  authenticate,
  [
    body('address').trim().notEmpty().withMessage('address is required'),
    body('question').trim().notEmpty().withMessage('question is required')
  ],
  validate,
  chat
);

module.exports = router;
