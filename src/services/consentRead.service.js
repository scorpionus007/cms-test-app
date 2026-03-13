/**
 * Consent Read / Derivation Layer.
 * Derives current consent state from consent_events (source of truth).
 * No consent status is stored in the consents table.
 * All queries use parameterized bindings only (no string interpolation).
 */
const { sequelize } = require('../models');
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

module.exports = {
  getConsentStateDerived,
};
