const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const { authenticate, requireTenant, requireRole, handleValidationErrors } = require('../middleware/auth.middleware');
const { createValidation, deleteParamValidation } = require('../validators/webhook.validator');

const router = express.Router();

router.post('/', authenticate, requireTenant, requireRole('owner', 'admin'), createValidation, handleValidationErrors, webhookController.create);
router.get('/', authenticate, requireTenant, requireRole('owner', 'admin'), webhookController.list);
router.delete('/:id', authenticate, requireTenant, requireRole('owner', 'admin'), deleteParamValidation, handleValidationErrors, webhookController.remove);

module.exports = router;
