const express = require('express');
const purposeController = require('../controllers/purpose.controller');
const { authenticate, requireTenant, requireRole } = require('../middleware/auth.middleware');
const {
  createPurposeValidation,
  updatePurposeValidation,
  purposeIdParamValidation,
  handleValidationErrors,
} = require('../validators/purpose.validator');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('owner', 'admin'),
  createPurposeValidation,
  handleValidationErrors,
  purposeController.create
);

router.get(
  '/',
  authenticate,
  requireTenant,
  purposeController.list
);

router.put(
  '/:id',
  authenticate,
  requireTenant,
  requireRole('owner', 'admin'),
  purposeIdParamValidation,
  updatePurposeValidation,
  handleValidationErrors,
  purposeController.update
);

router.delete(
  '/:id',
  authenticate,
  requireTenant,
  requireRole('owner', 'admin'),
  purposeIdParamValidation,
  handleValidationErrors,
  purposeController.remove
);

module.exports = router;
