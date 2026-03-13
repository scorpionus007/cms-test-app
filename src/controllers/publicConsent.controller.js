const publicConsentService = require('../services/publicConsent.service');
const getClientIp = require('../utils/getClientIp');

async function getPurposes(req, res, next) {
  try {
    const purposes = await publicConsentService.listPurposes(req.tenant.id, getClientIp(req));
    res.status(200).json({ purposes });
  } catch (err) {
    next(err);
  }
}

async function getPolicy(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const policyVersion = await publicConsentService.getActivePolicy(req.tenant.id, appId, getClientIp(req));
    res.status(200).json({ policyVersion });
  } catch (err) {
    next(err);
  }
}

async function grantConsent(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const body = {
      user_id: req.body.userId ?? req.body.user_id,
      purpose_id: req.body.purposeId ?? req.body.purpose_id,
      policy_version_id: req.body.policyVersionId ?? req.body.policy_version_id,
    };
    await publicConsentService.grantConsent(req.tenant.id, appId, body, getClientIp(req));
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function withdrawConsent(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const body = {
      user_id: req.body.userId ?? req.body.user_id,
      purpose_id: req.body.purposeId ?? req.body.purpose_id,
    };
    await publicConsentService.withdrawConsent(req.tenant.id, appId, body, getClientIp(req));
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPurposes,
  getPolicy,
  grantConsent,
  withdrawConsent,
};
