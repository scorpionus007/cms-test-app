const express = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate, requireTenant, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get(
  '/',
  authenticate,
  requireTenant,
  requireRole('owner', 'admin'),
  auditController.list
);

module.exports = router;
