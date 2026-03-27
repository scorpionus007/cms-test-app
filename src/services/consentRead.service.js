/**
 * Consent Read / Derivation Layer.
 * Derives current consent state from consent_events (source of truth).
 * No consent status is stored in the consents table.
 * All queries use parameterized bindings only (no string interpolation).
 */
const { sequelize, Purpose, ConsentStateCache, PolicyVersion } = require('../models');
const { QueryTypes } = require('sequelize');

/** Fixed SQL: all user/request-derived values are passed via replacements (parameterized). App-scoped. */
const LATEST_EVENT_PER_CONSENT_SQL = `
SELECT c.purpose_id, e.event_type, e.policy_version_id, e.created_at
FROM consents c
INNER JOIN consent_events e ON e.consent_id = c.id
WHERE c.tenant_id = :tenantId AND c.app_id = :appId AND c.user_id = :userId
AND NOT EXISTS (
  SELECT 1 FROM consent_events e2
  WHERE e2.consent_id = c.id
  AND (
    e2.created_at > e.created_at
    OR (e2.created_at = e.created_at AND e2.id > e.id)
  )
)
ORDER BY c.purpose_id
`;

const LATEST_EVENT_PER_CONSENT_EXPORT_SQL = `
SELECT c.id AS consent_id, c.purpose_id, e.event_type, e.policy_version_id, e.created_at
FROM consents c
INNER JOIN consent_events e ON e.consent_id = c.id
WHERE c.tenant_id = :tenantId AND c.app_id = :appId AND c.user_id = :userId
AND NOT EXISTS (
  SELECT 1 FROM consent_events e2
  WHERE e2.consent_id = c.id
  AND (
    e2.created_at > e.created_at
    OR (e2.created_at = e.created_at AND e2.id > e.id)
  )
)
ORDER BY c.purpose_id
`;

/**
 * Derive current consent state for a user from events. App-scoped.
 *
 * @param {string} tenantId - From JWT
 * @param {string} appId - App UUID
 * @param {string} userId - Pseudonymous user identifier
 * @returns {Promise<Array<{ purposeId: string, status: string, policyVersionId: string|null, timestamp: string }>>}
 */
async function getConsentStateDerived(tenantId, appId, userId) {
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

  const rows = await sequelize.query(LATEST_EVENT_PER_CONSENT_SQL, {
    replacements: { tenantId, appId, userId: normalizedUserId },
    type: QueryTypes.SELECT,
  });
  const list = Array.isArray(rows) ? rows : [];

  return list.map((r) => ({
    purposeId: r.purpose_id,
    status: r.event_type === 'GRANTED' ? 'granted' : 'withdrawn',
    policyVersionId: r.policy_version_id || null,
    timestamp: r.created_at ? new Date(r.created_at).toISOString() : null,
  }));
}

/**
 * Consent artifact: simplified shape with dataPrincipal, dataFiduciary, purpose (id, text), data_ids, audit, signature placeholder, status.
 */
async function getConsentArtifact(tenantId, appId, userId, ipAddress = null) {
  const normalizedUserId = userId && typeof userId === 'string' ? userId.trim() : '';
  if (!appId || !normalizedUserId) {
    const err = new Error(appId ? 'userId is required' : 'app_id is required');
    err.statusCode = 400;
    throw err;
  }

  const rows = await sequelize.query(LATEST_EVENT_PER_CONSENT_EXPORT_SQL, {
    replacements: { tenantId, appId, userId: normalizedUserId },
    type: QueryTypes.SELECT,
  });
  const rowList = Array.isArray(rows) ? rows : [];
  const purposeIds = [...new Set(rowList.map((r) => r.purpose_id).filter(Boolean))];
  const purposes = purposeIds.length
    ? await Purpose.findAll({
        where: { id: purposeIds },
        attributes: ['id', 'description', 'required_data'],
      })
    : [];
  const purposeMap = new Map(purposes.map((p) => [p.id, p]));

  const consentArtifacts = rowList.map((r) => {
    const purpose = purposeMap.get(r.purpose_id);
    const dataIds = purpose && Array.isArray(purpose.required_data) ? purpose.required_data : [];
    const timestamp = r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString();
    return {
      consentArtifact: {
        consentId: r.consent_id,
        timestamp,
        dataPrincipal: { id: normalizedUserId },
        dataFiduciary: { id: tenantId },
        purpose: {
          id: purpose ? purpose.id : null,
          text: purpose ? purpose.description || null : null,
        },
        policy_version_id: r.policy_version_id || null,
        data: { data_ids: dataIds },
        audit: {
          consentMethod: 'CMS',
          timestamp,
          createdBy: 'CONSENT_MANAGER_SYSTEM',
          ipAddress: ipAddress || null,
        },
        signature: {
          type: 'CONSENT_MANAGER_SIGNATURE',
          algorithm: 'RSA-SHA256',
          value: null,
        },
        status: r.event_type === 'GRANTED' ? 'ACTIVE' : 'WITHDRAWN',
      },
    };
  });

  return { consentArtifacts };
}

/** @deprecated Use getConsentArtifact. Kept for backward compatibility. */
async function getConsentStateExport(tenantId, appId, userId) {
  const normalized = userId && typeof userId === 'string' ? userId.trim() : '';
  const result = await getConsentArtifact(tenantId, appId, userId);
  const list = result.consentArtifacts || [];
  return {
    dataPrincipal: { id: list[0]?.consentArtifact?.dataPrincipal?.id ?? normalized },
    dataFiduciary: { id: tenantId },
    consents: list.map((a) => ({
      consentId: a.consentArtifact.consentId,
      timestamp: a.consentArtifact.timestamp,
      purpose: a.consentArtifact.purpose,
      data: a.consentArtifact.data,
      policyVersionId: a.consentArtifact.policy_version_id,
      status: a.consentArtifact.status === 'ACTIVE' ? 'granted' : 'withdrawn',
    })),
  };
}

module.exports = {
  getConsentStateDerived,
  getConsentStateExport,
  getConsentArtifact,
  async listAppConsents(tenantId, appId) {
    const rows = await ConsentStateCache.findAll({
      where: { tenant_id: tenantId, app_id: appId },
      attributes: ['user_id', 'purpose_id', 'current_status', 'policy_version_id', 'updated_at'],
      include: [
        { model: Purpose, attributes: ['id', 'name'], required: false },
        { model: PolicyVersion, attributes: ['id', 'version_label'], required: false },
      ],
      order: [['updated_at', 'DESC']],
    });

    return rows.map((r) => ({
      id: `${r.user_id}:${r.purpose_id}`,
      userId: r.user_id,
      purposeId: r.purpose_id,
      purposeName: r.Purpose?.name || 'Unknown Purpose',
      policyVersion: r.PolicyVersion?.version_label || null,
      policyVersionId: r.policy_version_id || null,
      currentStatus: r.current_status,
      updatedAt: r.updated_at,
    }));
  },
};
