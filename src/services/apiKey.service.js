/**
 * API key management: create, list, revoke. Keys are tenant-scoped and used for public/CMS integration.
 */
const crypto = require('crypto');
const { ApiKey } = require('../models');
const auditService = require('./audit.service');

const KEY_PREFIX = 'cms_';
const KEY_BYTES = 32;

/**
 * Generate a new secret key (prefix + hex). Caller must persist it; it is only returned once.
 * @returns {string}
 */
function generateKey() {
  const raw = crypto.randomBytes(KEY_BYTES).toString('hex');
  return KEY_PREFIX + raw;
}

/**
 * Create an API key for the tenant. The plain key is returned only in this response.
 * @param {string} tenantId
 * @param {Object} body - { name?: string }
 * @param {string} [actorClientId] - For audit
 * @param {string} [ipAddress]
 * @returns {Promise<{ id, name, key, active, created_at }>}
 */
async function createApiKey(tenantId, body, actorClientId = null, ipAddress = null) {
  const name = body.name != null && typeof body.name === 'string' ? body.name.trim() || null : null;

  const key = generateKey();
  const record = await ApiKey.create({
    tenant_id: tenantId,
    name: name || null,
    key,
    active: true,
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'API_KEY_CREATED',
    resource_type: 'api_key',
    resource_id: record.id,
    metadata: name ? { name } : null,
    ip_address: ipAddress,
  });

  return {
    id: record.id,
    name: record.name,
    key: record.key,
    active: record.active,
    created_at: record.created_at,
  };
}

/**
 * List API keys for the tenant. Key value is masked (only last 4 chars shown).
 * @param {string} tenantId
 * @returns {Promise<Array<{ id, name, key_masked, active, created_at }>>}
 */
async function listApiKeys(tenantId) {
  const rows = await ApiKey.findAll({
    where: { tenant_id: tenantId },
    attributes: ['id', 'name', 'key', 'active', 'created_at'],
    order: [['created_at', 'DESC']],
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    key_masked: r.key ? `...${r.key.slice(-4)}` : '...',
    active: r.active,
    created_at: r.created_at,
  }));
}

/**
 * Revoke (deactivate) an API key. Fails if key not found or not in tenant.
 * @param {string} tenantId
 * @param {string} keyId - UUID of the API key
 * @param {string} [actorClientId]
 * @param {string} [ipAddress]
 */
async function revokeApiKey(tenantId, keyId, actorClientId = null, ipAddress = null) {
  const record = await ApiKey.findOne({
    where: { id: keyId, tenant_id: tenantId },
  });

  if (!record) {
    const err = new Error('API key not found');
    err.statusCode = 404;
    throw err;
  }

  await record.update({ active: false });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'API_KEY_REVOKED',
    resource_type: 'api_key',
    resource_id: record.id,
    metadata: record.name ? { name: record.name } : null,
    ip_address: ipAddress,
  });
}

module.exports = {
  generateKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
};
