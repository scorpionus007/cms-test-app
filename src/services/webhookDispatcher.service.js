/**
 * Webhook dispatcher: enqueue delivery jobs. Does not send HTTP; worker does.
 * API stays fast; Redis/BullMQ + worker handle delivery with retries.
 */
const { Webhook } = require('../models');
const webhookQueue = require('../queues/webhook.queue');
const { WebhookDelivery } = require('../models');
const axios = require('axios');
const { signPayload } = require('../utils/webhookSigner');

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

      // If Redis/BullMQ is enabled, enqueue jobs and return immediately.
      if (webhookQueue) {
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
        return;
      }

      // Fallback (no Redis): deliver synchronously via HTTP.
      // This lets you test webhooks without installing Redis or running the worker.
      const timestampSeconds = Math.floor(Date.now() / 1000);
      const payloadStr = JSON.stringify(body);
      for (const wh of subscribed) {
        const url = wh.url && typeof wh.url === 'string' ? wh.url.trim() : '';
        if (!url) continue;

        const secret = wh.secret || '';
        const { signatureHeader } = signPayload(secret, payloadStr, timestampSeconds);

        const response = await axios.post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': signatureHeader,
            'x-webhook-timestamp': String(timestampSeconds),
            'x-webhook-event': event,
          },
          timeout: 15000,
          validateStatus: () => true,
        });

        const success = response.status >= 200 && response.status < 300;
        await WebhookDelivery.create({
          webhook_id: wh.id,
          payload: body,
          status: success ? 'success' : 'failed',
          response_code: response.status,
          retries: 0,
        });
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
