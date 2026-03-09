const publicConsentService = require('../services/publicConsent.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
}

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
    const policyVersion = await publicConsentService.getActivePolicy(req.tenant.id, getClientIp(req));
    res.status(200).json({ policyVersion });
  } catch (err) {
    next(err);
  }
}

async function grantConsent(req, res, next) {
  try {
    await publicConsentService.grantConsent(req.tenant.id, req.body, getClientIp(req));
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function withdrawConsent(req, res, next) {
  try {
    await publicConsentService.withdrawConsent(req.tenant.id, req.body, getClientIp(req));
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
