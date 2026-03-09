const { Client } = require('../models');
const auditService = require('./audit.service');

const ALLOWED_ROLES = ['owner', 'admin', 'compliance_manager', 'auditor', 'viewer'];

/**
 * Invite a new client to the tenant (status = inactive until they sign in with Google).
 * @param {string} [ipAddress] - Client IP for audit
 */
async function inviteClient(tenantId, actorClientId, body, ipAddress = null) {
  const { email, role } = body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    const err = new Error('email is required');
    err.statusCode = 400;
    throw err;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const roleValue = role ? String(role).trim().toLowerCase() : 'viewer';
  if (!ALLOWED_ROLES.includes(roleValue)) {
    const err = new Error(`role must be one of: ${ALLOWED_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const [client, created] = await Client.findOrCreate({
    where: { tenant_id: tenantId, email: normalizedEmail },
    defaults: {
      tenant_id: tenantId,
      email: normalizedEmail,
      role: roleValue,
      provider: 'google',
      status: 'inactive',
    },
  });

  if (!created) {
    const err = new Error('A client with this email already exists in the organization');
    err.statusCode = 409;
    throw err;
  }

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'CLIENT_INVITED',
    resource_type: 'client',
    resource_id: client.id,
    metadata: { invited_email: normalizedEmail, role: roleValue },
    ip_address: ipAddress,
  });

  return client.toJSON();
}

/**
 * List all clients for a tenant.
 */
async function listClients(tenantId) {
  const clients = await Client.findAll({
    where: { tenant_id: tenantId },
    attributes: ['id', 'email', 'name', 'role', 'status', 'provider', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  return clients.map((c) => c.toJSON());
}

module.exports = {
  inviteClient,
  listClients,
};
