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
  withdrawConsentBodyValidation,
  getConsentParamValidation,
  handleValidationErrors,
} = require('../validators/consent.validator');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireTenant, requireApp);

// GET /apps/:appId/consent/:userId/artifact - consent artifact (purpose id, data_ids, audit, signature)
router.get(
  '/consent/:userId/artifact',
  authorize('consent:write'),
  getConsentParamValidation,
  handleValidationErrors,
  consentReadController.getArtifact
);
// GET /apps/:appId/consent/:userId/export - legacy export shape
router.get(
  '/consent/:userId/export',
  authorize('consent:write'),
  getConsentParamValidation,
  handleValidationErrors,
  consentReadController.getExport
);

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

// DELETE /apps/:appId/consent - withdraw (identity derived from email+phone)
router.delete(
  '/consent',
  authorize('consent:write'),
  withdrawConsentBodyValidation,
  handleValidationErrors,
  consentController.withdraw
);

module.exports = router;
