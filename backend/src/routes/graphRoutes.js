// src/routes/graphRoutes.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getTransactionGraph } = require('../controllers/graphController');

const router = express.Router();

router.get('/:address', authenticate, getTransactionGraph);

module.exports = router;
