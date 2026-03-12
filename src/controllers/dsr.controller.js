const dsrService = require('../services/dsr.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
}

/**
 * POST /dsr/request (public, API key) or POST /public/dsr/request
 */
async function submitRequest(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const result = await dsrService.submitRequest(tenantId, req.body, getClientIp(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /dsr (JWT, admin) - list requests for tenant
 */
async function list(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const { status, request_type, page, limit } = req.query;
    const result = await dsrService.listRequests(tenantId, {
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
    const clientId = req.user.client_id;
    const dsrId = req.params.id;
    const result = await dsrService.updateStatus(tenantId, dsrId, req.body, clientId, getClientIp(req));
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
    const clientId = req.user.client_id;
    const dsrId = req.params.id;
    const result = await dsrService.exportData(tenantId, dsrId, clientId, getClientIp(req));
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
