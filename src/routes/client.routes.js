const express = require('express');
const { body } = require('express-validator');
const clientController = require('../controllers/client.controller');
const { authenticate, requireTenant, requireRole, handleValidationErrors } = require('../middleware/auth.middleware');

const router = express.Router();

const inviteValidation = [
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('email must be valid'),
  body('role').optional().trim().isIn(['owner', 'admin', 'compliance_manager', 'auditor', 'viewer']).withMessage('invalid role'),
];

router.post('/invite', authenticate, requireTenant, requireRole('owner', 'admin'), inviteValidation, handleValidationErrors, clientController.invite);
router.get('/', authenticate, requireTenant, clientController.list);

module.exports = router;
