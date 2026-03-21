const consentService = require('../services/consent.service');
const getClientIp = require('../utils/getClientIp');
const { pseudonymizeIdentityPair } = require('../utils/pseudonymizeUserIdentifier');

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
    const { userId, emailHash, phoneHash } = pseudonymizeIdentityPair(
      req.user.tenant_id,
      req.body.email,
      req.body.phone_number ?? req.body.phoneNumber
    );
    const result = await consentService.grantConsent(
      req.user.tenant_id,
      appId,
      req.user.client_id,
      {
        userId,
        emailHash,
        phoneHash,
        purposeId: req.body.purposeId,
        policyVersionId: req.body.policyVersionId,
      },
      getClientIp(req)
    );
    res.status(200).json({
      message: 'Consent recorded',
      consentId: result.consentId,
      consentEventId: result.consentEventId,
      recordedAt: result.recordedAt,
      grantedAt: result.grantedAt,
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
    const { userId, emailHash } = pseudonymizeIdentityPair(
      req.user.tenant_id,
      req.body.email,
      req.body.phone_number ?? req.body.phoneNumber
    );
    const purposeId = req.body.purposeId ?? req.body.purpose_id ?? req.params.purposeId;
    const result = await consentService.withdrawConsent(
      req.user.tenant_id,
      appId,
      userId,
      purposeId,
      req.user.client_id,
      getClientIp(req),
      { emailHash }
    );
    const message = result.alreadyWithdrawn ? 'Consent already withdrawn' : 'Consent withdrawn';
    res.status(200).json({
      message,
      consentId: result.consentId,
      consentEventId: result.consentEventId,
      recordedAt: result.recordedAt,
      alreadyWithdrawn: Boolean(result.alreadyWithdrawn),
      withdrawn: result.withdrawn,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getState,
  grant,
  withdraw,
};
