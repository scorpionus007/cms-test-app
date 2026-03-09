const { Tenant, Client, sequelize } = require('../models');
const authService = require('./auth.service');
const auditService = require('./audit.service');
const { logOnboarding } = require('../utils/logger');

/**
 * First-time onboarding: create tenant and client (owner). Caller must ensure user is not already a client.
 * @param {Object} user - From JWT (email, name)
 * @param {Object} body - organization_name, industry, country
 * @param {string} [ipAddress] - Client IP for audit
 */
async function onboardOrganization(user, body, ipAddress = null) {
  const { organization_name, industry, country } = body;
  const email = user.email;
  const name = user.name || null;

  if (!organization_name || typeof organization_name !== 'string' || !organization_name.trim()) {
    const err = new Error('organization_name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!country || typeof country !== 'string' || !country.trim()) {
    const err = new Error('country is required');
    err.statusCode = 400;
    throw err;
  }

  const existingClient = await authService.findClientByEmail(email);
  if (existingClient) {
    const err = new Error('User already onboarded');
    err.statusCode = 400;
    throw err;
  }

  let tenant;
  let client;
  const transaction = await sequelize.transaction();
  try {
    tenant = await Tenant.create(
      {
        name: organization_name.trim(),
        industry: industry ? String(industry).trim() : null,
        country: country.trim(),
        dpdp_applicable: true,
      },
      { transaction }
    );
    client = await Client.create(
      {
        tenant_id: tenant.id,
        email: email.toLowerCase(),
        name: name || null,
        role: 'owner',
        provider: 'google',
        status: 'active',
      },
      { transaction }
    );
    await tenant.update({ created_by: client.id }, { transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    if (err.name === 'SequelizeUniqueConstraintError') {
      const e = new Error('Organization name or domain already exists');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  }

  logOnboarding('onboarding_new', {
    tenant_id: tenant.id,
    client_id: client.id,
    email: client.email,
    tenant_name: tenant.name,
  });
  await auditService.logAction({
    tenant_id: tenant.id,
    actor_client_id: client.id,
    action: 'TENANT_CREATED',
    resource_type: 'tenant',
    resource_id: tenant.id,
    metadata: { organization_name: tenant.name, created_by_email: client.email },
    ip_address: ipAddress,
  });

  const token = authService.issueJwt({
    tenant_id: tenant.id,
    client_id: client.id,
    email: client.email,
    name: client.name,
    role: client.role,
    scopes: ['consent:write', 'dsr:submit', 'audit:read'],
  });

  return {
    tenant: tenant.toJSON(),
    client: client.toJSON(),
    token,
  };
}

/**
 * Get tenant by id (for logged-in user's tenant_id).
 */
async function getTenantById(tenantId) {
  const tenant = await Tenant.findByPk(tenantId, {
    attributes: ['id', 'name', 'domain', 'industry', 'country', 'dpdp_applicable', 'created_by', 'created_at'],
  });
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    throw err;
  }
  return tenant.toJSON();
}

module.exports = {
  onboardOrganization,
  getTenantById,
};
