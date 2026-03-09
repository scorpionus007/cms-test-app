const tenantService = require('../services/tenant.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
}

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

module.exports = {
  onboard,
  getMe,
};
