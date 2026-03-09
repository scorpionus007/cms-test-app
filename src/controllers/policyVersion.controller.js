const policyVersionService = require('../services/policyVersion.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
}

async function create(req, res, next) {
  try {
    const policyVersion = await policyVersionService.createPolicyVersion(
      req.user.tenant_id,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(201).json({ policyVersion });
  } catch (err) {
    next(err);
  }
}

async function getActive(req, res, next) {
  try {
    const policyVersion = await policyVersionService.getActivePolicyVersion(
      req.user.tenant_id,
      req.user.client_id,
      getClientIp(req)
    );
    res.status(200).json({ policyVersion });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const policyVersions = await policyVersionService.listPolicyVersions(
      req.user.tenant_id,
      req.user.client_id,
      getClientIp(req)
    );
    res.status(200).json({ policyVersions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getActive,
  list,
};
