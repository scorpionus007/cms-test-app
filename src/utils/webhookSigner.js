const crypto = require('crypto');

/**
 * Sign payload for webhook delivery (HMAC SHA256).
 *
 * Signature scheme (v1):
 * - CMS sends:
 *   - x-webhook-timestamp: <unix seconds>
 *   - x-webhook-signature: t=<unix seconds>,v1=<hex hmac>
 * - HMAC input: `${timestamp}.${rawBody}`
 *
 * Receivers should:
 * - Read raw request body bytes/string (exact JSON payload as received)
 * - Compute HMAC-SHA256(secret, `${t}.${rawBody}`) => hex
 * - Compare with v1 using constant-time comparison
 * @param {string} secret
 * @param {string} payloadStr - exact JSON string that will be sent
 * @param {number|string} timestampSeconds - unix timestamp (seconds)
 * @returns {{ signatureHeader: string, signature: string, timestamp: string }}
 */
function signPayload(secret, payloadStr, timestampSeconds) {
  if (!secret || typeof secret !== 'string') return { signatureHeader: '', signature: '', timestamp: '' };
  const ts = String(timestampSeconds);
  const msg = `${ts}.${payloadStr}`;
  const sig = crypto.createHmac('sha256', secret).update(msg, 'utf8').digest('hex');
  return { signatureHeader: `t=${ts},v1=${sig}`, signature: sig, timestamp: ts };
}

module.exports = { signPayload };
