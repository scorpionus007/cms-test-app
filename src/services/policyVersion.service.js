const crypto = require('crypto');
const { PolicyVersion, sequelize } = require('../models');
const auditService = require('./audit.service');
const webhookDispatcher = require('./webhookDispatcher.service');

function computeDocumentHash(policyText) {
  return crypto.createHash('sha256').update(policyText, 'utf8').digest('hex');
}

/**
 * Create policy version: deactivate previous active for this app, create new, set is_active = true.
 * App-scoped (policy is per app).
 */
async function createPolicyVersion(tenantId, appId, actorClientId, body, ipAddress = null) {
  const { version, policy_text, effective_from } = body;
  if (!version || typeof version !== 'string' || !version.trim()) {
    const err = new Error('version is required');
    err.statusCode = 400;
    throw err;
  }
  if (!policy_text || typeof policy_text !== 'string') {
    const err = new Error('policy_text is required');
    err.statusCode = 400;
    throw err;
  }
  if (!appId) {
    const err = new Error('app_id is required');
    err.statusCode = 400;
    throw err;
  }

  const versionLabel = version.trim();
  const effectiveFrom = effective_from ? new Date(effective_from) : new Date();
  if (isNaN(effectiveFrom.getTime())) {
    const err = new Error('effective_from must be a valid date');
    err.statusCode = 400;
    throw err;
  }

  const documentHash = computeDocumentHash(policy_text);

  let createdId;
  const transaction = await sequelize.transaction();
  try {
    await PolicyVersion.update(
      { is_active: false },
      { where: { tenant_id: tenantId, app_id: appId }, transaction }
    );
    const policyVersion = await PolicyVersion.create(
      {
        tenant_id: tenantId,
        app_id: appId,
        version_label: versionLabel,
        policy_text: policy_text,
        document_hash: documentHash,
        effective_from: effectiveFrom,
        is_active: true,
      },
      { transaction }
    );
    createdId = policyVersion.id;
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    if (err.name === 'SequelizeUniqueConstraintError') {
      const e = new Error('A policy version with this version label already exists for this app');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  }

  const created = await PolicyVersion.findByPk(createdId, {
    attributes: ['id', 'tenant_id', 'app_id', 'version_label', 'policy_text', 'document_hash', 'effective_from', 'is_active', 'created_at', 'updated_at'],
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'POLICY_VERSION_CREATE',
    resource_type: 'policy_version',
    resource_id: created.id,
    metadata: { policy_version_id: created.id },
    ip_address: ipAddress,
  });

  webhookDispatcher.dispatch({
    event: 'policy.updated',
    tenant_id: tenantId,
    payload: { policy_version_id: created.id, version: versionLabel },
  });

  return created.toJSON();
}

/**
 * Get active policy version for app.
 */
async function getActivePolicyVersion(tenantId, appId, actorClientId, ipAddress = null) {
  const policyVersion = await PolicyVersion.findOne({
    where: { tenant_id: tenantId, app_id: appId, is_active: true },
    attributes: ['id', 'tenant_id', 'app_id', 'version_label', 'policy_text', 'document_hash', 'effective_from', 'is_active', 'created_at', 'updated_at'],
  });
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'POLICY_VERSION_READ',
    resource_type: 'policy_version',
    resource_id: policyVersion ? policyVersion.id : null,
    metadata: null,
    ip_address: ipAddress,
  });
  return policyVersion ? policyVersion.toJSON() : null;
}

/**
 * List all policy versions for app, ordered by created_at desc.
 */
async function listPolicyVersions(tenantId, appId, actorClientId, ipAddress = null) {
  const versions = await PolicyVersion.findAll({
    where: { tenant_id: tenantId, app_id: appId },
    attributes: ['id', 'tenant_id', 'app_id', 'version_label', 'policy_text', 'document_hash', 'effective_from', 'is_active', 'created_at', 'updated_at'],
    order: [['created_at', 'DESC']],
  });
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'POLICY_VERSION_LIST',
    resource_type: 'policy_version',
    resource_id: null,
    metadata: null,
    ip_address: ipAddress,
  });
  return versions.map((v) => v.toJSON());
}

module.exports = {
  createPolicyVersion,
  getActivePolicyVersion,
  listPolicyVersions,
  computeDocumentHash,
};
