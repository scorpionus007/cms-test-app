const express = require('express');
const publicConsentController = require('../controllers/publicConsent.controller');
const { authenticateApiKey } = require('../middleware/apiKey.middleware');
const { publicLimiter } = require('../config/security');
const {
  grantConsentValidation,
  withdrawConsentValidation,
  handleValidationErrors,
} = require('../validators/publicConsent.validator');

const router = express.Router();

router.use(publicLimiter);
router.use(authenticateApiKey);

router.get('/purposes', publicConsentController.getPurposes);
router.get('/policy', publicConsentController.getPolicy);

router.post(
  '/consent',
  grantConsentValidation,
  handleValidationErrors,
  publicConsentController.grantConsent
);

router.delete(
  '/consent',
  withdrawConsentValidation,
  handleValidationErrors,
  publicConsentController.withdrawConsent
);

module.exports = router;
