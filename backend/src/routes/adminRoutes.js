// src/routes/adminRoutes.js
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listUsers,
  updateUserStatus,
  updateUserRole,
  getDashboardStats
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication AND the 'admin' role
router.use(authenticate, authorize('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/status', [body('isActive').isBoolean()], validate, updateUserStatus);
router.patch('/users/:id/role', [body('role').isIn(['admin', 'investigator'])], validate, updateUserRole);
router.get('/dashboard', getDashboardStats);

module.exports = router;
