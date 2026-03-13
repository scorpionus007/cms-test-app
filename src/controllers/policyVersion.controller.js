const policyVersionService = require('../services/policyVersion.service');
const getClientIp = require('../utils/getClientIp');

async function create(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const policyVersion = await policyVersionService.createPolicyVersion(
      req.user.tenant_id,
      appId,
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
    const appId = req.appId || req.params.appId;
    const policyVersion = await policyVersionService.getActivePolicyVersion(
      req.user.tenant_id,
      appId,
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
    const appId = req.appId || req.params.appId;
    const policyVersions = await policyVersionService.listPolicyVersions(
      req.user.tenant_id,
      appId,
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
