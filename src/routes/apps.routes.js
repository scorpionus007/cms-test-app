/**
 * App-scoped consent routes. Mount at /apps/:appId (so paths become /apps/:appId/consent, etc.).
 * Requires authenticate, requireTenant, requireApp (appId from params).
 */
const express = require('express');
const consentReadController = require('../controllers/consentRead.controller');
const consentController = require('../controllers/consent.controller');
const { authenticate, requireTenant, authorize } = require('../middleware/auth.middleware');
const { requireApp } = require('../middleware/app.middleware');
const {
  grantConsentValidation,
  withdrawConsentParamValidation,
  getConsentParamValidation,
  handleValidationErrors,
} = require('../validators/consent.validator');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireTenant, requireApp);

// GET /apps/:appId/consent/:userId - derived consent state
router.get(
  '/consent/:userId',
  authorize('consent:write'),
  getConsentParamValidation,
  handleValidationErrors,
  consentReadController.getState
);

// POST /apps/:appId/consent - grant
router.post(
  '/consent',
  authorize('consent:write'),
  grantConsentValidation,
  handleValidationErrors,
  consentController.grant
);

// DELETE /apps/:appId/consent/:userId/:purposeId - withdraw
router.delete(
  '/consent/:userId/:purposeId',
  authorize('consent:write'),
  withdrawConsentParamValidation,
  handleValidationErrors,
  consentController.withdraw
);

module.exports = router;
