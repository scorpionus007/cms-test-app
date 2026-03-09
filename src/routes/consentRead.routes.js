const express = require('express');
const consentReadController = require('../controllers/consentRead.controller');
const { authenticate, requireTenant, authorize } = require('../middleware/auth.middleware');
const { getConsentParamValidation, handleValidationErrors } = require('../validators/consent.validator');

const router = express.Router();

router.get(
  '/:userId',
  authenticate,
  requireTenant,
  authorize('consent:write'),
  getConsentParamValidation,
  handleValidationErrors,
  consentReadController.getState
);

module.exports = router;
