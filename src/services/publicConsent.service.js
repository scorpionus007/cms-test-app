/**
 * Public Consent API service. For external CMS / websites; uses API key auth.
 * All queries strictly tenant-scoped via req.tenant.id. Never expose tenant_id or client_id.
 */
const { Purpose, PolicyVersion } = require('../models');
const auditService = require('./audit.service');
const consentService = require('./consent.service');
const { pseudonymizeIdentityPair } = require('../utils/pseudonymizeUserIdentifier');

/**
 * List active purposes for consent banner. Audit: PUBLIC_PURPOSE_LIST.
 */
async function listPurposes(tenantId, ipAddress = null) {
  const purposes = await Purpose.findAll({
    where: { tenant_id: tenantId, active: true },
    attributes: ['id', 'name', 'description', 'required', 'required_data', 'validity_days', 'permissions'],
    order: [['name', 'ASC']],
  });
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: null,
    action: 'PUBLIC_PURPOSE_LIST',
    resource_type: 'purpose',
    resource_id: null,
    metadata: null,
    ip_address: ipAddress,
  });
  return purposes.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    required: p.required,
    required_data: Array.isArray(p.required_data) ? p.required_data : null,
    validity_days: p.validity_days ?? null,
    permissions: p.permissions || null,
  }));
}

/**
 * Get active policy version for app. Audit: PUBLIC_POLICY_READ.
 */
async function getActivePolicy(tenantId, appId, ipAddress = null) {
  const row = await PolicyVersion.findOne({
    where: { tenant_id: tenantId, app_id: appId, is_active: true },
    attributes: ['id', 'version_label', 'policy_text', 'effective_from'],
  });
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: null,
    action: 'PUBLIC_POLICY_READ',
    resource_type: 'policy_version',
    resource_id: row ? row.id : null,
    metadata: null,
    ip_address: ipAddress,
  });
  if (!row) return null;
  return {
    id: row.id,
    version: row.version_label,
    policy_text: row.policy_text,
    effective_from: row.effective_from ? new Date(row.effective_from).toISOString().slice(0, 10) : null,
  };
}

/**
 * Submit user consent for app. Delegates to consent.service with PUBLIC_CONSENT_GRANTED audit.
 */
async function grantConsent(tenantId, appId, body, ipAddress = null) {
  const { userId, emailHash, phoneHash } = pseudonymizeIdentityPair(tenantId, body.email, body.phone_number);
  const mapped = {
    userId,
    emailHash,
    phoneHash,
    purposeId: body.purpose_id,
    policyVersionId: body.policy_version_id,
  };
  const result = await consentService.grantConsent(tenantId, appId, null, mapped, ipAddress, {
    auditActionGranted: 'PUBLIC_CONSENT_GRANTED',
  });
  return { success: true, consentId: result.consentId };
}

/**
 * Withdraw consent for (user_id, purpose_id). App-scoped.
 */
async function withdrawConsent(tenantId, appId, body, ipAddress = null) {
  const { userId, emailHash } = pseudonymizeIdentityPair(tenantId, body.email, body.phone_number);
  await consentService.withdrawConsent(
    tenantId,
    appId,
    userId,
    body.purpose_id,
    null,
    ipAddress,
    { auditActionWithdrawn: 'PUBLIC_CONSENT_WITHDRAWN', emailHash }
  );
  return { success: true };
}

module.exports = {
  listPurposes,
  getActivePolicy,
  grantConsent,
  withdrawConsent,
};
