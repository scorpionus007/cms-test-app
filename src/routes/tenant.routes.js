const express = require('express');
const { body } = require('express-validator');
const tenantController = require('../controllers/tenant.controller');
const apiKeyController = require('../controllers/apiKey.controller');
const { authenticate, requireTenant, requireRole, handleValidationErrors } = require('../middleware/auth.middleware');
const { createValidation, revokeParamValidation } = require('../validators/apiKey.validator');

const router = express.Router();

const onboardValidation = [
  body('organization_name').trim().notEmpty().withMessage('organization_name is required'),
  body('country').trim().notEmpty().withMessage('country is required'),
  body('industry').optional().trim().isString(),
];

router.post('/onboard', authenticate, onboardValidation, handleValidationErrors, tenantController.onboard);
router.get('/me', authenticate, requireTenant, tenantController.getMe);

// API keys (owner/admin)
router.post('/api-keys', authenticate, requireTenant, requireRole('owner', 'admin'), createValidation, handleValidationErrors, apiKeyController.create);
router.get('/api-keys', authenticate, requireTenant, requireRole('owner', 'admin'), apiKeyController.list);
router.delete('/api-keys/:id', authenticate, requireTenant, requireRole('owner', 'admin'), revokeParamValidation, handleValidationErrors, apiKeyController.revoke);

module.exports = router;
