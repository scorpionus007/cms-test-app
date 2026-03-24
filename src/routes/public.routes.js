const express = require('express');
const publicConsentController = require('../controllers/publicConsent.controller');
const redirectConsentController = require('../controllers/redirectConsent.controller');
const { authenticateApiKey } = require('../middleware/apiKey.middleware');
const { requireAppPublic } = require('../middleware/app.middleware');
const { publicLimiter } = require('../config/security');
const {
  grantConsentValidation,
  withdrawConsentValidation,
  handleValidationErrors,
} = require('../validators/publicConsent.validator');
const {
  createRedirectConsentRequestValidation,
  redirectTokenParamValidation,
  verifyRedirectOtpValidation,
  handleValidationErrors: handleRedirectValidationErrors,
} = require('../validators/redirectConsent.validator');

const router = express.Router();

router.use(publicLimiter);

// Hosted redirect consent endpoints are token-based (no API key header required).
router.get(
  '/consent/redirect/:token',
  redirectTokenParamValidation,
  handleRedirectValidationErrors,
  redirectConsentController.getHostedPage
);
router.post(
  '/consent/redirect/:token/send-otp',
  redirectTokenParamValidation,
  handleRedirectValidationErrors,
  redirectConsentController.sendOtp
);
router.post(
  '/consent/redirect/:token/verify-otp',
  redirectTokenParamValidation,
  verifyRedirectOtpValidation,
  handleRedirectValidationErrors,
  redirectConsentController.verifyOtp
);

router.use(authenticateApiKey);

// Tenant-level: purposes are shared across all apps
router.get('/purposes', publicConsentController.getPurposes);

// App-scoped: policy and consent (require appId in path)
const appPublicRouter = express.Router({ mergeParams: true });
appPublicRouter.use(requireAppPublic);
appPublicRouter.get('/policy', publicConsentController.getPolicy);
appPublicRouter.post('/consent', grantConsentValidation, handleValidationErrors, publicConsentController.grantConsent);
appPublicRouter.delete('/consent', withdrawConsentValidation, handleValidationErrors, publicConsentController.withdrawConsent);
appPublicRouter.post(
  '/consent/redirect/request',
  createRedirectConsentRequestValidation,
  handleRedirectValidationErrors,
  redirectConsentController.createRequest
);
router.use('/apps/:appId', appPublicRouter);

module.exports = router;
