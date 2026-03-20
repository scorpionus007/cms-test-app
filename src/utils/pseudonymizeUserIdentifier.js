const crypto = require('crypto');

function getPseudonymSecret() {
  // Prefer a dedicated secret; fall back to JWT_SECRET for convenience in dev.
  return process.env.PSEUDONYMIZATION_SECRET || process.env.JWT_SECRET || '';
}

/**
 * Pseudonymize a user-provided identifier (e.g. email/phone) into a stable tenant-scoped HMAC hash.
 * Output is hex SHA-256 HMAC, safe to store as user_id.
 */
function pseudonymizeUserIdentifier(tenantId, identifier) {
  if (!tenantId || typeof tenantId !== 'string') throw new Error('tenantId is required');
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) throw new Error('identifier is required');

  const secret = getPseudonymSecret();
  if (!secret) {
    const err = new Error('PSEUDONYMIZATION_SECRET (or JWT_SECRET) must be set');
    err.statusCode = 500;
    throw err;
  }

  const normalized = identifier.trim().toLowerCase();
  const payload = `${tenantId}:${normalized}`;
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  // Keep leading + if present, drop other separators/spaces.
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

function pseudonymizeEmail(tenantId, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    const err = new Error('email is required');
    err.statusCode = 400;
    throw err;
  }
  return pseudonymizeUserIdentifier(tenantId, `email:${normalized}`);
}

function pseudonymizePhone(tenantId, phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    const err = new Error('phone_number is required');
    err.statusCode = 400;
    throw err;
  }
  return pseudonymizeUserIdentifier(tenantId, `phone:${normalized}`);
}

function pseudonymizeIdentityPair(tenantId, email, phone) {
  const emailHash = pseudonymizeEmail(tenantId, email);
  const phoneHash = pseudonymizePhone(tenantId, phone);
  // Stable combined principal hash used as consent.user_id key
  const userId = pseudonymizeUserIdentifier(tenantId, `pair:${emailHash}:${phoneHash}`);
  return { userId, emailHash, phoneHash };
}

module.exports = {
  pseudonymizeUserIdentifier,
  pseudonymizeEmail,
  pseudonymizePhone,
  pseudonymizeIdentityPair,
};

