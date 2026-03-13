/**
 * Resolve app from params and ensure it belongs to the current tenant (JWT).
 * Sets req.app and req.appId. Use after authenticate + requireTenant.
 */
const appService = require('../services/app.service');

async function requireApp(req, res, next) {
  const appId = req.params.appId;
  if (!appId) {
    const err = new Error('appId is required');
    err.statusCode = 400;
    return next(err);
  }
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant onboarding required');
    err.statusCode = 403;
    return next(err);
  }
  const app = await appService.getAppForTenant(tenantId, appId);
  if (!app) {
    const err = new Error('App not found');
    err.statusCode = 404;
    return next(err);
  }
  req.app = app;
  req.appId = app.id;
  next();
}

/**
 * Resolve app for public API (API key auth). Uses req.tenant.id. Use after authenticateApiKey.
 */
async function requireAppPublic(req, res, next) {
  const appId = req.params.appId;
  if (!appId) {
    const err = new Error('appId is required');
    err.statusCode = 400;
    return next(err);
  }
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    const err = new Error('Invalid API key');
    err.statusCode = 401;
    return next(err);
  }
  const app = await appService.getAppForTenant(tenantId, appId);
  if (!app) {
    const err = new Error('App not found');
    err.statusCode = 404;
    return next(err);
  }
  req.app = app;
  req.appId = app.id;
  next();
}

module.exports = { requireApp, requireAppPublic };
