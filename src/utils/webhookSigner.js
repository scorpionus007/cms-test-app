const crypto = require('crypto');

/**
 * Sign payload for webhook delivery (HMAC SHA256).
 * Clients verify using x-webhook-signature header.
 * @param {string} secret
 * @param {string|object} payload - JSON string or object (will be stringified)
 * @returns {string} hex signature
 */
function signPayload(secret, payload) {
  if (!secret || typeof secret !== 'string') return '';
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

module.exports = { signPayload };
