const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { Tenant, Client, sequelize } = require('../models');
const { logOnboarding } = require('../utils/logger');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const DEFAULT_SCOPES = ['consent:write', 'dsr:submit', 'audit:read'];

/**
 * Verify Google ID token and return payload with verified email.
 * @param {string} googleToken - Google ID token from client
 * @returns {Promise<{ email: string }>}
 */
async function verifyGoogleToken(googleToken) {
  if (!GOOGLE_CLIENT_ID) {
    const err = new Error('Google Client ID is not configured');
    err.statusCode = 500;
    throw err;
  }
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    const e = new Error('Invalid or expired Google token');
    e.statusCode = 401;
    e.cause = err;
    throw e;
  }
  const payload = ticket.getPayload();
  const email = payload.email;
  if (!email) {
    const e = new Error('Email not provided by Google');
    e.statusCode = 401;
    throw e;
  }
  const name = payload.name || payload.given_name || null;
  return { email, name };
}

/**
 * Find client by email. Email is unique across tenants per requirements.
 * @param {string} email
 * @returns {Promise<Client|null>}
 */
/**
 * Find any client with this email (across all tenants). Used to detect "already onboarded".
 */
async function findClientByEmail(email) {
  return Client.findOne({
    where: { email: email.toLowerCase() },
    attributes: ['id', 'tenant_id', 'email', 'role', 'status'],
  });
}

/**
 * Create tenant with name = email domain, status = active, trust_level = 1.
 * @param {string} email
 * @returns {Promise<Tenant>}
 */
function createTenantForEmail(email, options = {}) {
  const domain = email.split('@')[1] || 'unknown';
  return Tenant.create(
    {
      name: domain,
      status: 'active',
      trust_level: 1,
    },
    options
  );
}

/**
 * Create client for tenant with provider=google, role=admin, status=active.
 * @param {string} tenantId
 * @param {string} email
 * @param {object} options - Sequelize options (e.g. transaction)
 * @returns {Promise<Client>}
 */
function createClient(tenantId, email, options = {}) {
  return Client.create(
    {
      tenant_id: tenantId,
      email: email.toLowerCase(),
      provider: 'google',
      role: 'admin',
      status: 'active',
    },
    options
  );
}

/**
 * Issue JWT with tenant_id, client_id, email, scopes.
 * @param {object} payload
 * @returns {string}
 */
function issueJwt(payload) {
  if (!JWT_SECRET) {
    const err = new Error('JWT secret is not configured');
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(
    {
      tenant_id: payload.tenant_id,
      client_id: payload.client_id,
      email: payload.email,
      name: payload.name || null,
      role: payload.role || null,
      scopes: payload.scopes || DEFAULT_SCOPES,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** JWT for users who have not yet completed tenant onboarding (no tenant_id/client_id). */
function issueOnboardingJwt(payload) {
  if (!JWT_SECRET) {
    const err = new Error('JWT secret is not configured');
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(
    {
      email: payload.email,
      name: payload.name || null,
      onboarding: true,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Google login: verify token. If client exists return full JWT; else return onboarding JWT (no tenant/client yet).
 * @param {string} googleToken
 * @returns {Promise<{ token, tenant_id?, client_id?, onboarding?, email, name? }>}
 */
async function googleLogin(googleToken) {
  if (!googleToken || typeof googleToken !== 'string') {
    const err = new Error('googleToken is required');
    err.statusCode = 400;
    throw err;
  }

  const { email, name } = await verifyGoogleToken(googleToken);
  const normalizedEmail = email.toLowerCase();

  const client = await findClientByEmail(normalizedEmail);

  if (client) {
    if (client.status === 'suspended' || client.status === 'inactive') {
      const err = new Error('Account is disabled. Contact your administrator.');
      err.statusCode = 403;
      throw err;
    }
    await Client.update(
      { last_login_at: new Date() },
      { where: { id: client.id } }
    );
    logOnboarding('login_existing', {
      client_id: client.id,
      tenant_id: client.tenant_id,
      email: normalizedEmail,
    });
    const token = issueJwt({
      tenant_id: client.tenant_id,
      client_id: client.id,
      email: client.email,
      name: name,
      role: client.role,
      scopes: DEFAULT_SCOPES,
    });
    return {
      token,
      tenant_id: client.tenant_id,
      client_id: client.id,
      email: client.email,
      name: client.name || name,
    };
  }

  const token = issueOnboardingJwt({ email: normalizedEmail, name });
  return {
    token,
    onboarding: true,
    email: normalizedEmail,
    name: name || null,
  };
}

/**
 * Get current user's client, tenant, and permissions (for GET /auth/me).
 */
async function getMe(tenantId, clientId, scopes = []) {
  const [client, tenant] = await Promise.all([
    Client.findByPk(clientId, {
      attributes: ['id', 'email', 'name', 'role', 'status', 'created_at'],
    }),
    Tenant.findByPk(tenantId, {
      attributes: ['id', 'name', 'domain', 'industry', 'country', 'consent_flow', 'dpdp_applicable', 'created_at'],
    }),
  ]);
  if (!client || !tenant) {
    const err = new Error('User or tenant not found');
    err.statusCode = 404;
    throw err;
  }
  if (client.tenant_id !== tenantId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  return {
    client: client.toJSON(),
    tenant: tenant.toJSON(),
    permissions: Array.isArray(scopes) && scopes.length > 0 ? scopes : ['consent:write', 'dsr:submit', 'audit:read'],
  };
}

module.exports = {
  verifyGoogleToken,
  findClientByEmail,
  createTenantForEmail,
  createClient,
  issueJwt,
  issueOnboardingJwt,
  googleLogin,
  getMe,
};
