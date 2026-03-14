const crypto = require('crypto');
const { Consent, ConsentEvent, ConsentStateCache, Purpose, PolicyVersion } = require('../models');
const auditService = require('./audit.service');
const webhookDispatcher = require('./webhookDispatcher.service');

/**
 * Generate chain event_hash for tamper evidence (SHA256).
 * Links to previous event: altering any past event breaks the chain.
 * previousHash: null or '' for first event in chain.
 */
function computeEventHash(consentId, eventType, policyVersionId, previousHash, createdAt) {
  const prev = previousHash || '';
  const pv = policyVersionId || '';
  const ts = createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
  const payload = consentId + eventType + pv + prev + ts;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Validate purpose belongs to tenant and exists.
 */
async function validatePurpose(tenantId, purposeId) {
  const purpose = await Purpose.findOne({
    where: { id: purposeId, tenant_id: tenantId },
  });
  if (!purpose) {
    const err = new Error('Purpose not found or does not belong to tenant');
    err.statusCode = 404;
    throw err;
  }
  return purpose;
}

/**
 * Validate policy version belongs to tenant and app and exists.
 */
async function validatePolicyVersion(tenantId, appId, policyVersionId) {
  const policy = await PolicyVersion.findOne({
    where: { id: policyVersionId, tenant_id: tenantId, app_id: appId },
  });
  if (!policy) {
    const err = new Error('Policy version not found or does not belong to this app');
    err.statusCode = 404;
    throw err;
  }
  return policy;
}

/**
 * Grant consent: find or create consent identity, append GRANTED event, audit.
 * App-scoped. @param {Object} [options] - Optional. auditActionGranted: e.g. 'PUBLIC_CONSENT_GRANTED' for public API.
 */
async function grantConsent(tenantId, appId, actorClientId, body, ipAddress = null, options = {}) {
  const auditAction = options.auditActionGranted || 'CONSENT_GRANTED';
  const { userId, purposeId, policyVersionId } = body;

  if (!appId) {
    const err = new Error('app_id is required');
    err.statusCode = 400;
    throw err;
  }
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const err = new Error('userId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!purposeId) {
    const err = new Error('purposeId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!policyVersionId) {
    const err = new Error('policyVersionId is required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedUserId = userId.trim();
  const purpose = await validatePurpose(tenantId, purposeId);
  await validatePolicyVersion(tenantId, appId, policyVersionId);

  let consent = await Consent.findOne({
    where: {
      tenant_id: tenantId,
      app_id: appId,
      user_id: normalizedUserId,
      purpose_id: purposeId,
    },
  });

  const now = new Date();
  const validityDays = purpose.validity_days != null ? purpose.validity_days : null;
  const expiresAt = validityDays != null ? new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000) : null;

  if (!consent) {
    consent = await Consent.create({
      tenant_id: tenantId,
      app_id: appId,
      user_id: normalizedUserId,
      purpose_id: purposeId,
      policy_version_id: policyVersionId,
      granted_at: now,
      expires_at: expiresAt,
      status: 'ACTIVE',
    });
  } else {
    await consent.update({
      policy_version_id: policyVersionId,
      granted_at: now,
      expires_at: expiresAt,
      status: 'ACTIVE',
    });
  }

  const latestEvent = await ConsentEvent.findOne({
    where: { consent_id: consent.id },
    order: [['created_at', 'DESC']],
    attributes: ['event_hash'],
  });
  const previousHash = latestEvent ? latestEvent.event_hash : null;
  const eventHash = computeEventHash(consent.id, 'GRANTED', policyVersionId, previousHash, now);

  await ConsentEvent.create({
    consent_id: consent.id,
    event_type: 'GRANTED',
    policy_version_id: policyVersionId,
    actor_type: 'client',
    previous_hash: previousHash,
    event_hash: eventHash,
  });

  await ConsentStateCache.upsert({
    tenant_id: tenantId,
    app_id: appId,
    user_id: normalizedUserId,
    purpose_id: purposeId,
    current_status: 'granted',
    policy_version_id: policyVersionId,
    updated_at: now,
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: auditAction,
    resource_type: 'consent',
    resource_id: consent.id,
    metadata: { user_id: normalizedUserId, purpose_id: purposeId, policy_version_id: policyVersionId },
    ip_address: ipAddress,
  });

  webhookDispatcher.dispatch({
    event: 'consent.granted',
    tenant_id: tenantId,
    payload: {
      user_id: normalizedUserId,
      purpose_id: purposeId,
      policy_version_id: policyVersionId,
    },
  });

  return { consentId: consent.id };
}

/**
 * Withdraw consent for a single (user, purpose): find consent identity, append WITHDRAWN event.
 * App-scoped. Idempotent: if latest event is already WITHDRAWN, no duplicate event is inserted.
 * @param {Object} [options] - Optional. auditActionWithdrawn: e.g. 'PUBLIC_CONSENT_WITHDRAWN' for public API.
 */
async function withdrawConsent(tenantId, appId, userId, purposeId, actorClientId, ipAddress = null, options = {}) {
  const auditAction = options.auditActionWithdrawn || 'CONSENT_WITHDRAWN';
  if (!appId) {
    const err = new Error('app_id is required');
    err.statusCode = 400;
    throw err;
  }
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const err = new Error('userId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!purposeId) {
    const err = new Error('purposeId is required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedUserId = userId.trim();

  const consent = await Consent.findOne({
    where: {
      tenant_id: tenantId,
      app_id: appId,
      user_id: normalizedUserId,
      purpose_id: purposeId,
    },
    attributes: ['id', 'purpose_id'],
  });

  if (!consent) {
    const err = new Error('Consent not found for this user and purpose');
    err.statusCode = 404;
    throw err;
  }

  const latestEvent = await ConsentEvent.findOne({
    where: { consent_id: consent.id },
    order: [['created_at', 'DESC']],
    attributes: ['event_type', 'event_hash', 'policy_version_id'],
  });

  if (latestEvent && latestEvent.event_type === 'WITHDRAWN') {
    return { withdrawn: 0, alreadyWithdrawn: true, consentId: consent.id };
  }

  // Preserve the policy version from the last GRANTED state so verify/read still shows it
  const lastPolicyVersionId = latestEvent && latestEvent.event_type === 'GRANTED' ? latestEvent.policy_version_id : null;

  const previousHash = latestEvent ? latestEvent.event_hash : null;
  const now = new Date();
  const eventHash = computeEventHash(consent.id, 'WITHDRAWN', lastPolicyVersionId, previousHash, now);

  await ConsentEvent.create({
    consent_id: consent.id,
    event_type: 'WITHDRAWN',
    policy_version_id: lastPolicyVersionId,
    actor_type: 'client',
    previous_hash: previousHash,
    event_hash: eventHash,
  });

  await consent.update({ status: 'WITHDRAWN' });

  await ConsentStateCache.upsert({
    tenant_id: tenantId,
    app_id: appId,
    user_id: normalizedUserId,
    purpose_id: consent.purpose_id,
    current_status: 'withdrawn',
    policy_version_id: lastPolicyVersionId,
    updated_at: now,
  });

  webhookDispatcher.dispatch({
    event: 'consent.withdrawn',
    tenant_id: tenantId,
    payload: {
      user_id: normalizedUserId,
      purpose_id: purposeId,
      policy_version_id: lastPolicyVersionId,
    },
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: auditAction,
    resource_type: 'consent',
    resource_id: consent.id,
    metadata: { user_id: normalizedUserId, purpose_id: purposeId },
    ip_address: ipAddress,
  });

  return { withdrawn: 1, consentId: consent.id };
}

/**
 * Get current consent state for a user from cache (read-optimized). App-scoped.
 */
async function getConsentState(tenantId, appId, userId) {
  if (!appId) {
    const err = new Error('app_id is required');
    err.statusCode = 400;
    throw err;
  }
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const err = new Error('userId is required');
    err.statusCode = 400;
    throw err;
  }
  const normalizedUserId = userId.trim();
  const rows = await ConsentStateCache.findAll({
    where: { tenant_id: tenantId, app_id: appId, user_id: normalizedUserId },
    attributes: ['purpose_id', 'current_status', 'policy_version_id', 'updated_at'],
    order: [['purpose_id', 'ASC']],
  });
  return rows.map((r) => ({
    purposeId: r.purpose_id,
    currentStatus: r.current_status,
    policyVersionId: r.policy_version_id,
    updatedAt: r.updated_at,
  }));
}

module.exports = {
  grantConsent,
  withdrawConsent,
  getConsentState,
  computeEventHash,
  validatePurpose,
  validatePolicyVersion,
};
