/**
 * Webhook dispatcher: find subscribed webhooks, POST signed payload, record deliveries.
 * All delivery is async (fire-and-forget) so APIs stay fast.
 */
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { Webhook, WebhookDelivery } = require('../models');

const SIGNATURE_HEADER = 'x-webhook-signature';

/**
 * Sign payload with HMAC SHA256 using secret.
 * @param {string} secret
 * @param {string} payloadStr - JSON string of payload
 * @returns {string} hex signature
 */
function signPayload(secret, payloadStr) {
  if (!secret || typeof secret !== 'string') return '';
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

/**
 * POST payload to URL with signature header. Returns { statusCode, success }.
 * @param {string} url
 * @param {string} payloadStr
 * @param {string} signature
 */
function postWebhook(url, payloadStr, signature) {
  return new Promise((resolve) => {
    let u;
    try {
      u = new URL(url);
    } catch (_) {
      return resolve({ statusCode: null, success: false });
    }
    const mod = u.protocol === 'https:' ? https : http;
    const options = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr, 'utf8'),
        [SIGNATURE_HEADER]: signature,
      },
    };
    const req = mod.request(options, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      resolve({ statusCode: res.statusCode, success });
    });
    req.on('error', () => resolve({ statusCode: null, success: false }));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ statusCode: null, success: false });
    });
    req.write(payloadStr, 'utf8');
    req.end();
  });
}

/**
 * Dispatch event to all matching webhooks (async). Does not block.
 * Payload should include event-specific fields; dispatcher adds event, tenant_id, timestamp.
 * @param {Object} params
 * @param {string} params.event - e.g. 'consent.granted', 'consent.withdrawn', 'policy.updated', 'purpose.created'
 * @param {string} params.tenant_id - Tenant UUID
 * @param {Object} params.payload - Event payload (user_id, purpose_id, policy_version_id, etc.)
 */
function dispatch({ event, tenant_id, payload }) {
  if (!event || !tenant_id) return;

  setImmediate(async () => {
    try {
      const webhooks = await Webhook.findAll({
        where: {
          tenant_id,
          active: true,
        },
        attributes: ['id', 'url', 'secret', 'events'],
      });

      const subscribed = webhooks.filter((wh) => {
        const events = wh.events && Array.isArray(wh.events) ? wh.events : [];
        return events.includes(event);
      });

      const fullPayload = {
        event,
        tenant_id,
        ...(payload && typeof payload === 'object' ? payload : {}),
        timestamp: new Date().toISOString(),
      };
      const payloadStr = JSON.stringify(fullPayload);

      for (const wh of subscribed) {
        const url = wh.url && typeof wh.url === 'string' ? wh.url.trim() : '';
        if (!url) {
          await WebhookDelivery.create({
            webhook_id: wh.id,
            payload: fullPayload,
            status: 'failed',
            response_code: null,
            retries: 0,
          });
          continue;
        }
        const secret = wh.secret || '';
        const signature = signPayload(secret, payloadStr);
        const { statusCode, success } = await postWebhook(url, payloadStr, signature);
        await WebhookDelivery.create({
          webhook_id: wh.id,
          payload: fullPayload,
          status: success ? 'success' : 'failed',
          response_code: statusCode,
          retries: 0,
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Webhook dispatch error:', err.message);
      }
    }
  });
}

module.exports = {
  dispatch,
  signPayload,
  SIGNATURE_HEADER,
};
