/**
 * Public Consent API service. For external CMS / websites; uses API key auth.
 * All queries strictly tenant-scoped via req.tenant.id. Never expose tenant_id or client_id.
 */
const { Purpose, PolicyVersion } = require('../models');
const auditService = require('./audit.service');
const consentService = require('./consent.service');

/**
 * List active purposes for consent banner. Audit: PUBLIC_PURPOSE_LIST.
 */
async function listPurposes(tenantId, ipAddress = null) {
  const purposes = await Purpose.findAll({
    where: { tenant_id: tenantId, active: true },
    attributes: ['id', 'name', 'description', 'required'],
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
  }));
}

/**
 * Get active policy version. Audit: PUBLIC_POLICY_READ.
 * Response uses "version" (from version_label) per spec.
 */
async function getActivePolicy(tenantId, ipAddress = null) {
  const row = await PolicyVersion.findOne({
    where: { tenant_id: tenantId, is_active: true },
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
 * Submit user consent. Delegates to consent.service with PUBLIC_CONSENT_GRANTED audit.
 */
async function grantConsent(tenantId, body, ipAddress = null) {
  const mapped = {
    userId: body.user_id,
    purposeId: body.purpose_id,
    policyVersionId: body.policy_version_id,
  };
  await consentService.grantConsent(tenantId, null, mapped, ipAddress, {
    auditActionGranted: 'PUBLIC_CONSENT_GRANTED',
  });
  return { success: true };
}

/**
 * Withdraw consent for (user_id, purpose_id). Delegates to consent.service with PUBLIC_CONSENT_WITHDRAWN audit.
 */
async function withdrawConsent(tenantId, body, ipAddress = null) {
  await consentService.withdrawConsent(
    tenantId,
    body.user_id,
    body.purpose_id,
    null,
    ipAddress,
    { auditActionWithdrawn: 'PUBLIC_CONSENT_WITHDRAWN' }
  );
  return { success: true };
}

module.exports = {
  listPurposes,
  getActivePolicy,
  grantConsent,
  withdrawConsent,
};
