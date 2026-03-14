const express = require('express');
const dataCatalogController = require('../controllers/dataCatalog.controller');
const { authenticate, requireTenant } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, requireTenant, dataCatalogController.list);
router.get('/:dataId', authenticate, requireTenant, dataCatalogController.getByDataId);

module.exports = router;
