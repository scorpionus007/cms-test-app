const { Purpose } = require('../models');
const auditService = require('./audit.service');
const webhookDispatcher = require('./webhookDispatcher.service');

/**
 * Create purpose scoped to tenant. All queries tenant-scoped.
 */
async function createPurpose(tenantId, actorClientId, body, ipAddress = null) {
  const { name, description, required } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }
  let purpose;
  try {
    purpose = await Purpose.create({
      tenant_id: tenantId,
      name: name.trim(),
      description: description != null ? String(description).trim() || null : null,
      required: Boolean(required),
      active: true,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const e = new Error('A purpose with this name already exists for the tenant');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  }
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'PURPOSE_CREATE',
    resource_type: 'purpose',
    resource_id: purpose.id,
    metadata: { purpose_id: purpose.id },
    ip_address: ipAddress,
  });

  webhookDispatcher.dispatch({
    event: 'purpose.created',
    tenant_id: tenantId,
    payload: { purpose_id: purpose.id },
  });

  return purpose.toJSON();
}

/**
 * List purposes for tenant; return only active = true.
 */
async function listPurposes(tenantId, actorClientId, ipAddress = null) {
  const purposes = await Purpose.findAll({
    where: { tenant_id: tenantId, active: true },
    attributes: ['id', 'tenant_id', 'name', 'description', 'required', 'active', 'created_at', 'updated_at'],
    order: [['name', 'ASC']],
  });
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'PURPOSE_LIST',
    resource_type: 'purpose',
    resource_id: null,
    metadata: null,
    ip_address: ipAddress,
  });
  return purposes.map((p) => p.toJSON());
}

/**
 * Update purpose. Tenant-scoped; only owner/admin may call.
 */
async function updatePurpose(tenantId, purposeId, actorClientId, body, ipAddress = null) {
  const purpose = await Purpose.findOne({
    where: { id: purposeId, tenant_id: tenantId },
  });
  if (!purpose) {
    const err = new Error('Purpose not found');
    err.statusCode = 404;
    throw err;
  }
  const { name, description, required, active } = body;
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = description == null ? null : String(description).trim();
  if (typeof required === 'boolean') updates.required = required;
  if (typeof active === 'boolean') updates.active = active;
  await purpose.update(updates);
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'PURPOSE_UPDATE',
    resource_type: 'purpose',
    resource_id: purpose.id,
    metadata: { purpose_id: purpose.id },
    ip_address: ipAddress,
  });
  return purpose.toJSON();
}

/**
 * Soft delete: set active = false. Tenant-scoped.
 */
async function deletePurpose(tenantId, purposeId, actorClientId, ipAddress = null) {
  const purpose = await Purpose.findOne({
    where: { id: purposeId, tenant_id: tenantId },
  });
  if (!purpose) {
    const err = new Error('Purpose not found');
    err.statusCode = 404;
    throw err;
  }
  await purpose.update({ active: false });
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'PURPOSE_DELETE',
    resource_type: 'purpose',
    resource_id: purpose.id,
    metadata: { purpose_id: purpose.id },
    ip_address: ipAddress,
  });
  return { deleted: true, purposeId: purpose.id };
}

module.exports = {
  createPurpose,
  listPurposes,
  updatePurpose,
  deletePurpose,
};
