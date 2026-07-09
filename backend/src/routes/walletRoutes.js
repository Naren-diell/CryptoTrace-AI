// src/routes/walletRoutes.js
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { searchWallet, getWalletHistory, listWallets } = require('../controllers/walletController');

const router = express.Router();

router.post(
  '/search',
  authenticate,
  [
    body('address').trim().notEmpty().withMessage('Wallet address is required'),
    body('chain').optional().isIn(['bitcoin', 'ethereum']).withMessage('chain must be bitcoin or ethereum'),
body('investigationId')
  .optional({ nullable: true })
  .isInt()
  .withMessage('investigationId must be an integer')  ],
  validate,
  searchWallet
);

router.get('/:address/history', authenticate, getWalletHistory);
router.get('/', authenticate, listWallets);

module.exports = router;
