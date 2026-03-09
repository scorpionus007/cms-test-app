/**
 * Webhook admin: create, list, delete. Owner/admin only.
 */
const crypto = require('crypto');
const { Webhook } = require('../models');

const ALLOWED_EVENTS = ['consent.granted', 'consent.withdrawn', 'policy.updated', 'purpose.created'];

/**
 * Create webhook. Generates secret if not provided.
 * @param {string} tenantId
 * @param {Object} body - { url, events, secret? }
 * @returns {Promise<{ id, url, events, active, created_at, secret }>} - secret returned only on create
 */
async function createWebhook(tenantId, body) {
  const url = body.url != null && typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) {
    const err = new Error('url is required');
    err.statusCode = 400;
    throw err;
  }
  let events = body.events;
  if (!Array.isArray(events) || events.length === 0) {
    const err = new Error('events must be a non-empty array');
    err.statusCode = 400;
    throw err;
  }
  events = events.map((e) => (typeof e === 'string' ? e.trim() : '')).filter(Boolean);
  events = [...new Set(events)].filter((e) => ALLOWED_EVENTS.includes(e));
  if (events.length === 0) {
    const err = new Error('events must contain at least one of: ' + ALLOWED_EVENTS.join(', '));
    err.statusCode = 400;
    throw err;
  }

  let secret = body.secret != null && typeof body.secret === 'string' ? body.secret.trim() : null;
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex');
  }

  const webhook = await Webhook.create({
    tenant_id: tenantId,
    url,
    secret,
    events,
    active: true,
  });

  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    active: webhook.active,
    created_at: webhook.created_at,
    secret,
  };
}

/**
 * List webhooks for tenant (no secret in response).
 */
async function listWebhooks(tenantId) {
  const rows = await Webhook.findAll({
    where: { tenant_id: tenantId },
    attributes: ['id', 'url', 'events', 'active', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    events: r.events,
    active: r.active,
    created_at: r.created_at,
  }));
}

/**
 * Delete webhook. Must belong to tenant.
 */
async function deleteWebhook(tenantId, webhookId) {
  const webhook = await Webhook.findOne({
    where: { id: webhookId, tenant_id: tenantId },
  });
  if (!webhook) {
    const err = new Error('Webhook not found');
    err.statusCode = 404;
    throw err;
  }
  await webhook.destroy();
}

module.exports = {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  ALLOWED_EVENTS,
};
