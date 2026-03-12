/**
 * Webhook dispatcher: enqueue delivery jobs. Does not send HTTP; worker does.
 * API stays fast; Redis/BullMQ + worker handle delivery with retries.
 */
const { Webhook } = require('../models');
const webhookQueue = require('../queues/webhook.queue');

/**
 * Build final payload shape: { event, timestamp, data }.
 * @param {string} event
 * @param {string} tenant_id
 * @param {Object} payload - event-specific fields
 */
function buildPayload(event, tenant_id, payload) {
  const data = { tenant_id, ...(payload && typeof payload === 'object' ? payload : {}) };
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Dispatch event to all matching webhooks by enqueueing one job per webhook.
 * Runs off the request (setImmediate) so API never waits for queue/Redis.
 * @param {Object} params
 * @param {string} params.event - consent.granted | consent.withdrawn | policy.updated | purpose.created
 * @param {string} params.tenant_id - Tenant UUID
 * @param {Object} params.payload - Event data (user_id, purpose_id, policy_version_id, etc.)
 */
function dispatch({ event, tenant_id, payload }) {
  if (!event || !tenant_id) return;

  setImmediate(async () => {
    try {
      const webhooks = await Webhook.findAll({
        where: { tenant_id, active: true },
        attributes: ['id', 'url', 'secret', 'events'],
      });

    const subscribed = webhooks.filter((wh) => {
      const events = wh.events && Array.isArray(wh.events) ? wh.events : [];
      return events.includes(event);
    });

    const body = buildPayload(event, tenant_id, payload);

    if (!webhookQueue) return; // Redis disabled or unavailable

    for (const wh of subscribed) {
      const url = wh.url && typeof wh.url === 'string' ? wh.url.trim() : '';
      if (!url) continue;

      await webhookQueue.add(
        'deliverWebhook',
        {
          webhook_id: wh.id,
          url,
          secret: wh.secret || '',
          body,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 60000 },
        }
      );
    }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        try {
          require('../config/logger').warn('Webhook queue error', { error: err.message });
        } catch (_) {}
      }
    }
  });
}

module.exports = {
  dispatch,
  buildPayload,
};
