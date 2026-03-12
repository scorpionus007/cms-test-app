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

// Public (API key): submit DSR request
router.post(
  '/request',
  publicLimiter,
  authenticateApiKey,
  submitValidation,
  handleValidationErrors,
  dsrController.submitRequest
);

// Admin (JWT): list, update status, export
router.get(
  '/',
  authenticate,
  requireTenant,
  authorize('dsr:submit'),
  listQueryValidation,
  handleValidationErrors,
  dsrController.list
);
router.patch(
  '/:id',
  authenticate,
  requireTenant,
  authorize('dsr:submit'),
  idParamValidation,
  updateStatusValidation,
  handleValidationErrors,
  dsrController.updateStatus
);
router.get(
  '/:id/export',
  authenticate,
  requireTenant,
  authorize('dsr:submit'),
  idParamValidation,
  handleValidationErrors,
  dsrController.exportData
);

module.exports = router;
