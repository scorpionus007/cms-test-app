const consentService = require('../services/consent.service');
const getClientIp = require('../utils/getClientIp');

/**
 * GET /consent/:userId - Get current consent state from cache
 */
async function getState(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const items = await consentService.getConsentState(req.user.tenant_id, appId, req.params.userId);
    res.status(200).json({ userId: req.params.userId.trim(), consents: items });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /consent - Grant consent (app-scoped)
 */
async function grant(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const result = await consentService.grantConsent(
      req.user.tenant_id,
      appId,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(200).json({
      message: 'Consent recorded',
      consentId: result.consentId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /consent/:userId/:purposeId - Withdraw consent for (user, purpose). App-scoped.
 */
async function withdraw(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const result = await consentService.withdrawConsent(
      req.user.tenant_id,
      appId,
      req.params.userId,
      req.params.purposeId,
      req.user.client_id,
      getClientIp(req)
    );
    const message = result.alreadyWithdrawn ? 'Consent already withdrawn' : 'Consent withdrawn';
    res.status(200).json({ message, consentId: result.consentId });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getState,
  grant,
  withdraw,
};
