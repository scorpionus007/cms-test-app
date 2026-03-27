const tenantService = require('../services/tenant.service');
const getClientIp = require('../utils/getClientIp');

async function onboard(req, res, next) {
  try {
    if (req.user.tenant_id) {
      const err = new Error('User already onboarded');
      err.statusCode = 400;
      return next(err);
    }
    const result = await tenantService.onboardOrganization(req.user, req.body, getClientIp(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const tenant = await tenantService.getTenantById(req.user.tenant_id);
    res.status(200).json(tenant);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const tenant = await tenantService.updateTenantById(req.user.tenant_id, req.body);
    res.status(200).json(tenant);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await tenantService.getTenantStats(req.user.tenant_id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  onboard,
  getMe,
  updateMe,
  getStats,
};
