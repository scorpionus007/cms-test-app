const express = require('express');
const dsrController = require('../controllers/dsr.controller');
const { authenticate, requireTenant, authorize, handleValidationErrors } = require('../middleware/auth.middleware');
const { authenticateApiKey } = require('../middleware/apiKey.middleware');
const { publicLimiter } = require('../config/security');
const {
  submitValidation,
  updateStatusValidation,
  idParamValidation,
  listQueryValidation,
} = require('../validators/dsr.validator');

const router = express.Router();

// Public (API key): submit DSR request. Body must include app_id.
router.post(
  '/request',
  publicLimiter,
  authenticateApiKey,
  submitValidation,
  handleValidationErrors,
  dsrController.submitRequest
);

// Admin (JWT, app-scoped): list, update status, export. Mount at /tenant/apps/:appId/dsr (requireApp sets req.appId).
const adminRouter = express.Router();
adminRouter.get(
  '/',
  authorize('dsr:submit'),
  listQueryValidation,
  handleValidationErrors,
  dsrController.list
);
adminRouter.patch(
  '/:id',
  authorize('dsr:submit'),
  idParamValidation,
  updateStatusValidation,
  handleValidationErrors,
  dsrController.updateStatus
);
adminRouter.get(
  '/:id/export',
  authorize('dsr:submit'),
  idParamValidation,
  handleValidationErrors,
  dsrController.exportData
);

module.exports = router;
module.exports.adminRouter = adminRouter;
