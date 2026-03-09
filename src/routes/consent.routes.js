const express = require('express');
const consentController = require('../controllers/consent.controller');
const { authenticate, requireTenant, authorize } = require('../middleware/auth.middleware');
const {
  grantConsentValidation,
  withdrawConsentParamValidation,
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
  '/:userId/:purposeId',
  authenticate,
  requireTenant,
  authorize('consent:write'),
  withdrawConsentParamValidation,
  handleValidationErrors,
  consentController.withdraw
);

module.exports = router;
