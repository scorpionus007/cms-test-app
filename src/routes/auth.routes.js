const express = require('express');
const authController = require('../controllers/auth.controller');
const {
  authenticate,
  requireTenant,
  googleLoginValidation,
  handleValidationErrors,
} = require('../middleware/auth.middleware');
const { authLimiter } = require('../config/security');

const router = express.Router();

router.post(
  '/google-login',
  authLimiter,
  googleLoginValidation,
  handleValidationErrors,
  authController.googleLogin
);

router.get('/me', authenticate, requireTenant, authController.getMe);

module.exports = router;
