const express = require('express');
const publicConsentController = require('../controllers/publicConsent.controller');
const { authenticateApiKey } = require('../middleware/apiKey.middleware');
const { requireAppPublic } = require('../middleware/app.middleware');
const { publicLimiter } = require('../config/security');
const {
  grantConsentValidation,
  withdrawConsentValidation,
  handleValidationErrors,
} = require('../validators/publicConsent.validator');

const router = express.Router();

router.use(publicLimiter);
router.use(authenticateApiKey);

// Tenant-level: purposes are shared across all apps
router.get('/purposes', publicConsentController.getPurposes);

// App-scoped: policy and consent (require appId in path)
const appPublicRouter = express.Router({ mergeParams: true });
appPublicRouter.use(requireAppPublic);
appPublicRouter.get('/policy', publicConsentController.getPolicy);
appPublicRouter.post('/consent', grantConsentValidation, handleValidationErrors, publicConsentController.grantConsent);
appPublicRouter.delete('/consent', withdrawConsentValidation, handleValidationErrors, publicConsentController.withdrawConsent);
router.use('/apps/:appId', appPublicRouter);

module.exports = router;
