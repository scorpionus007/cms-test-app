const { App } = require('../models');
const auditService = require('./audit.service');

/**
 * Create app for tenant. Slug must be unique per tenant.
 */
async function createApp(tenantId, actorClientId, body, ipAddress = null) {
  const { name, slug } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }
  const slugNorm = (slug != null && String(slug).trim()) ? String(slug).trim().toLowerCase().replace(/\s+/g, '-') : null;
  if (!slugNorm) {
    const err = new Error('slug is required');
    err.statusCode = 400;
    throw err;
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slugNorm)) {
    const err = new Error('slug must be lowercase alphanumeric and hyphens only');
    err.statusCode = 400;
    throw err;
  }
  let app;
  try {
    app = await App.create({
      tenant_id: tenantId,
      name: name.trim(),
      slug: slugNorm,
      status: 'active',
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const e = new Error('An app with this slug already exists for the tenant');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  }
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'APP_CREATED',
    resource_type: 'app',
    resource_id: app.id,
    metadata: { app_id: app.id, slug: app.slug },
    ip_address: ipAddress,
  });
  return app.toJSON();
}

/**
 * List apps for tenant.
 */
async function listApps(tenantId) {
  const apps = await App.findAll({
    where: { tenant_id: tenantId },
    order: [['name', 'ASC']],
  });
  return apps.map((a) => a.toJSON());
}

/**
 * Get app by id; must belong to tenant.
 */
async function getAppById(tenantId, appId) {
  const app = await App.findOne({
    where: { id: appId, tenant_id: tenantId },
  });
  if (!app) {
    const err = new Error('App not found');
    err.statusCode = 404;
    throw err;
  }
  return app.toJSON();
}

/**
 * Update app. Owner/admin only.
 */
async function updateApp(tenantId, appId, actorClientId, body, ipAddress = null) {
  const app = await App.findOne({
    where: { id: appId, tenant_id: tenantId },
  });
  if (!app) {
    const err = new Error('App not found');
    err.statusCode = 404;
    throw err;
  }
  const { name, slug, status } = body;
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (slug !== undefined) {
    const slugNorm = String(slug).trim().toLowerCase().replace(/\s+/g, '-');
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slugNorm)) {
      const err = new Error('slug must be lowercase alphanumeric and hyphens only');
      err.statusCode = 400;
      throw err;
    }
    updates.slug = slugNorm;
  }
  if (status !== undefined && ['active', 'inactive'].includes(status)) updates.status = status;
  await app.update(updates);
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'APP_UPDATED',
    resource_type: 'app',
    resource_id: app.id,
    metadata: { app_id: app.id },
    ip_address: ipAddress,
  });
  return app.toJSON();
}

/**
 * Delete app (hard delete). Only if no policy/consent/dsr depend on it, or we allow cascade.
 * For simplicity we allow delete; FKs will prevent if there are policy_versions/consents/dsr_requests.
 */
async function deleteApp(tenantId, appId, actorClientId, ipAddress = null) {
  const app = await App.findOne({
    where: { id: appId, tenant_id: tenantId },
  });
  if (!app) {
    const err = new Error('App not found');
    err.statusCode = 404;
    throw err;
  }
  await app.destroy();
  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'APP_DELETED',
    resource_type: 'app',
    resource_id: appId,
    metadata: { app_id: appId },
    ip_address: ipAddress,
  });
  return { deleted: true, app_id: appId };
}

/**
 * Resolve app by id and tenant (for middleware / public API).
 */
async function getAppForTenant(tenantId, appId) {
  const app = await App.findOne({
    where: { id: appId, tenant_id: tenantId, status: 'active' },
  });
  if (!app) return null;
  return app;
}

module.exports = {
  createApp,
  listApps,
  getAppById,
  updateApp,
  deleteApp,
  getAppForTenant,
};
