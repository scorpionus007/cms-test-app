const express = require('express');
const consentController = require('../controllers/consent.controller');
const { authenticate, requireTenant, authorize } = require('../middleware/auth.middleware');
const {
  grantConsentValidation,
  withdrawConsentBodyValidation,
  handleValidationErrors,
} = require('../validators/consent.validator');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireTenant,
  authorize('consent:write'),
  grantConsentValidation,
  handleValidationErrors,
  consentController.grant
);

router.delete(
  '/',
  authenticate,
  requireTenant,
  authorize('consent:write'),
  withdrawConsentBodyValidation,
  handleValidationErrors,
  consentController.withdraw
);

module.exports = router;
