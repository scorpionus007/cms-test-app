const dsrService = require('../services/dsr.service');
const getClientIp = require('../utils/getClientIp');

/**
 * POST /dsr/request (public, API key) or POST /public/dsr/request
 */
async function submitRequest(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const appId = req.body.app_id || req.params.appId;
    const result = await dsrService.submitRequest(tenantId, appId, req.body, getClientIp(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /dsr (JWT, admin) - list requests for app
 */
async function list(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const appId = req.appId || req.params.appId;
    const { status, request_type, page, limit } = req.query;
    const result = await dsrService.listRequests(tenantId, appId, {
      status,
      request_type,
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /dsr/:id (JWT, admin) - update status
 */
async function updateStatus(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const appId = req.appId || req.params.appId;
    const clientId = req.user.client_id;
    const dsrId = req.params.id;
    const result = await dsrService.updateStatus(tenantId, appId, dsrId, req.body, clientId, getClientIp(req));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /dsr/:id/export (JWT, admin) - export data for access request
 */
async function exportData(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const appId = req.appId || req.params.appId;
    const clientId = req.user.client_id;
    const dsrId = req.params.id;
    const result = await dsrService.exportData(tenantId, appId, dsrId, clientId, getClientIp(req));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitRequest,
  list,
  updateStatus,
  exportData,
};
