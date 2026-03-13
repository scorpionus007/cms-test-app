const express = require('express');
const { body } = require('express-validator');
const tenantController = require('../controllers/tenant.controller');
const apiKeyController = require('../controllers/apiKey.controller');
const appController = require('../controllers/app.controller');
const policyVersionRoutes = require('./policyVersion.routes');
const { adminRouter: dsrAdminRoutes } = require('./dsr.routes');
const { authenticate, requireTenant, requireRole, handleValidationErrors } = require('../middleware/auth.middleware');
const { requireApp } = require('../middleware/app.middleware');
const { createValidation, revokeParamValidation } = require('../validators/apiKey.validator');
const {
  createAppValidation,
  updateAppValidation,
  appIdParamValidation,
  handleValidationErrors: handleAppValidationErrors,
} = require('../validators/app.validator');

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

// Apps (owner/admin for create/update/delete)
router.get('/apps', authenticate, requireTenant, appController.list);
router.post('/apps', authenticate, requireTenant, requireRole('owner', 'admin'), createAppValidation, handleAppValidationErrors, appController.create);
router.get('/apps/:appId', authenticate, requireTenant, appIdParamValidation, handleAppValidationErrors, appController.getById);
router.put('/apps/:appId', authenticate, requireTenant, requireRole('owner', 'admin'), appIdParamValidation, updateAppValidation, handleAppValidationErrors, appController.update);
router.delete('/apps/:appId', authenticate, requireTenant, requireRole('owner', 'admin'), appIdParamValidation, handleAppValidationErrors, appController.remove);

// App-scoped: policy versions and DSR (admin routes only; public DSR submit stays at POST /dsr/request with app_id in body)
const appScopedRouter = express.Router({ mergeParams: true });
appScopedRouter.use(authenticate, requireTenant, requireApp);
appScopedRouter.use('/policy-versions', policyVersionRoutes);
appScopedRouter.use('/dsr', dsrAdminRoutes);
router.use('/apps/:appId', appScopedRouter);

module.exports = router;
