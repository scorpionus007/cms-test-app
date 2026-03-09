const consentReadService = require('../services/consentRead.service');
const auditService = require('../services/audit.service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
}

/**
 * GET /consent/:userId — Derive current consent state from consent_events.
 * Authenticate via JWT, tenant_id from JWT, then derive and audit CONSENT_READ.
 */
async function getState(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const userId = req.params.userId.trim();

    const consents = await consentReadService.getConsentStateDerived(tenantId, userId);

    await auditService.logAction({
      tenant_id: tenantId,
      actor_client_id: req.user.client_id,
      action: 'CONSENT_READ',
      resource_type: 'consent',
      resource_id: null,
      metadata: { user_id: userId },
      ip_address: getClientIp(req),
    });

    res.status(200).json({ consents });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getState,
};
