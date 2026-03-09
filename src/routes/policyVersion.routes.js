const express = require('express');
const policyVersionController = require('../controllers/policyVersion.controller');
const { authenticate, requireTenant, requireRole } = require('../middleware/auth.middleware');
const {
  createPolicyVersionValidation,
  handleValidationErrors,
} = require('../validators/policyVersion.validator');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireTenant,
  requireRole('owner', 'admin'),
  createPolicyVersionValidation,
  handleValidationErrors,
  policyVersionController.create
);

router.get(
  '/active',
  authenticate,
  requireTenant,
  policyVersionController.getActive
);

router.get(
  '/',
  authenticate,
  requireTenant,
  requireRole('owner', 'admin'),
  policyVersionController.list
);

module.exports = router;
