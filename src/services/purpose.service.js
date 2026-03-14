const { Purpose, DataCatalog } = require('../models');
const auditService = require('./audit.service');
const webhookDispatcher = require('./webhookDispatcher.service');

/** Normalize name for comparison (trim + lowercase) to avoid DB collation mismatches. */
function normalizeName(str) {
  return (str == null || typeof str !== 'string') ? '' : str.trim().toLowerCase();
}

/**
 * Validate required_data: each data_id must exist in data_catalog and be active.
 * Returns catalog rows for validity check.
 */
async function validateRequiredData(requiredData) {
  if (!Array.isArray(requiredData) || requiredData.length === 0) return [];
  const ids = requiredData.filter((id) => typeof id === 'string' && id.trim());
  if (ids.length === 0) return [];
  const catalog = await DataCatalog.findAll({
    where: { data_id: ids, status: 'active' },
    attributes: ['data_id', 'max_validity_days'],
  });
  const found = new Set(catalog.map((c) => c.data_id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) {
    const err = new Error(`Data catalog entries not found or inactive: ${missing.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return catalog;
}

/**
 * Max allowed validity_days for a purpose = MIN(max_validity_days) of its required_data. null = no limit.
 */
function getMaxAllowedValidityDays(catalogRows) {
  if (!catalogRows || catalogRows.length === 0) return null;
  const days = catalogRows.map((c) => c.max_validity_days).filter((d) => d != null);
  if (days.length === 0) return null;
  return Math.min(...days);
}

/**
 * Create purpose scoped to tenant. All queries tenant-scoped.
 */
async function createPurpose(tenantId, actorClientId, body, ipAddress = null) {
  const { name, description, required, required_data, validity_days, permissions } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }
  const catalogRows = await validateRequiredData(required_data);
  const maxAllowed = getMaxAllowedValidityDays(catalogRows);
  if (typeof validity_days === 'number') {
    if (validity_days < 0) {
      const err = new Error('validity_days must be non-negative');
      err.statusCode = 400;
      throw err;
    }
    if (maxAllowed != null && validity_days > maxAllowed) {
      const err = new Error(`validity_days cannot exceed ${maxAllowed} (min of data_catalog.max_validity_days for required_data)`);
      err.statusCode = 400;
      throw err;
    }
  }
  const trimmedName = name.trim();
  const normalizedNew = normalizeName(trimmedName);
  // Match by normalized name (trim + lowercase) so we don't miss rows due to DB collation
  const allSameTenant = await Purpose.findAll({
    where: { tenant_id: tenantId },
    attributes: ['id', 'name', 'active'],
  });
  const existing = allSameTenant.find((p) => normalizeName(p.name) === normalizedNew);
  if (existing && existing.active) {
    const err = new Error(`A purpose with the name "${trimmedName}" already exists for this tenant. Use a different name or update the existing purpose.`);
    err.statusCode = 409;
    throw err;
  }
  const payload = {
    tenant_id: tenantId,
    name: trimmedName,
    description: description != null ? String(description).trim() || null : null,
    required: Boolean(required),
    active: true,
  };
  if (Array.isArray(required_data)) payload.required_data = required_data;
  if (typeof validity_days === 'number') payload.validity_days = validity_days;
  if (permissions != null && typeof permissions === 'object') payload.permissions = permissions;

  let purpose;
  if (existing && !existing.active) {
    // Reactivate and update the inactive purpose with this name instead of creating a duplicate
    await existing.update(payload);
    purpose = await Purpose.findByPk(existing.id, {
      attributes: ['id', 'tenant_id', 'name', 'description', 'required', 'required_data', 'permissions', 'validity_days', 'retention_days', 'active', 'created_at', 'updated_at'],
    });
  } else {
    try {
      purpose = await Purpose.create(payload);
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        // Conflict: find row by normalized name (DB collation may differ from our WHERE)
        const allForTenant = await Purpose.findAll({
          where: { tenant_id: tenantId },
          attributes: ['id', 'name', 'active'],
        });
        const conflicting = allForTenant.find((p) => normalizeName(p.name) === normalizedNew);
        if (conflicting && !conflicting.active) {
          const row = await Purpose.findByPk(conflicting.id);
          await row.update(payload);
          purpose = await Purpose.findByPk(conflicting.id, {
            attributes: ['id', 'tenant_id', 'name', 'description', 'required', 'required_data', 'permissions', 'validity_days', 'retention_days', 'active', 'created_at', 'updated_at'],
          });
        } else if (conflicting && conflicting.active) {
          const e = new Error(`A purpose with the name "${trimmedName}" already exists for this tenant. Use a different name or update the existing purpose.`);
          e.statusCode = 409;
          throw e;
        } else {
          // Unique constraint fired but no row matched by name – possible schema issue (e.g. unique on tenant_id only)
          const existingNames = allForTenant.map((p) => p.name).join(', ') || 'none';
          const e = new Error(
            `Cannot create purpose: a conflict occurred. Existing purpose names for this tenant: ${existingNames}. ` +
            'Ensure the database allows multiple purposes per tenant (unique on tenant_id + name). Run: npm run db:sync'
          );
          e.statusCode = 409;
          throw e;
        }
      } else {
        throw err;
      }
    }
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
 * List purposes for tenant. By default only active = true; pass includeInactive: true to include soft-deleted.
 */
async function listPurposes(tenantId, actorClientId, ipAddress = null, options = {}) {
  const where = { tenant_id: tenantId };
  if (!options.includeInactive) where.active = true;
  const purposes = await Purpose.findAll({
    where,
    attributes: [
      'id', 'tenant_id', 'name', 'description', 'required',
      'required_data', 'permissions', 'validity_days', 'active', 'created_at', 'updated_at',
    ],
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
  const { name, description, required, active, required_data, validity_days, permissions } = body;
  if (required_data !== undefined) {
    const catalogRows = await validateRequiredData(required_data);
    const maxAllowed = getMaxAllowedValidityDays(catalogRows);
    const v = validity_days !== undefined ? validity_days : purpose.validity_days;
    if (typeof v === 'number' && maxAllowed != null && v > maxAllowed) {
      const err = new Error(`validity_days cannot exceed ${maxAllowed} (min of data_catalog.max_validity_days for required_data)`);
      err.statusCode = 400;
      throw err;
    }
  } else if (validity_days !== undefined && Array.isArray(purpose.required_data) && purpose.required_data.length > 0) {
    const catalogRows = await DataCatalog.findAll({
      where: { data_id: purpose.required_data, status: 'active' },
      attributes: ['max_validity_days'],
    });
    const maxAllowed = getMaxAllowedValidityDays(catalogRows);
    if (maxAllowed != null && validity_days > maxAllowed) {
      const err = new Error(`validity_days cannot exceed ${maxAllowed}`);
      err.statusCode = 400;
      throw err;
    }
  }
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = description == null ? null : String(description).trim();
  if (typeof required === 'boolean') updates.required = required;
  if (typeof active === 'boolean') updates.active = active;
  if (Array.isArray(required_data)) updates.required_data = required_data;
  if (typeof validity_days === 'number') updates.validity_days = validity_days;
  if (permissions !== undefined) updates.permissions = permissions != null && typeof permissions === 'object' ? permissions : null;
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
