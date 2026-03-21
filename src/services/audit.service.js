/**
 * Audit logging for compliance tracking. Records important actions per tenant.
 */
const { AuditLog, Op, sequelize } = require('../models');
const { pseudonymizeEmail } = require('../utils/pseudonymizeUserIdentifier');

/**
 * Log an action to the audit log.
 * @param {Object} params
 * @param {string} params.tenant_id - Tenant UUID
 * @param {string} [params.actor_client_id] - Client who performed the action
 * @param {string} params.action - Action name (e.g. TENANT_CREATED, CLIENT_LOGIN, CLIENT_INVITED)
 * @param {string} [params.resource_type] - e.g. tenant, client
 * @param {string} [params.resource_id] - UUID of the affected resource
 * @param {Object} [params.metadata] - Additional context (JSON)
 * @param {string} [params.ip_address] - Client IP
 */
async function logAction({
  tenant_id,
  actor_client_id = null,
  action,
  resource_type = null,
  resource_id = null,
  metadata = null,
  ip_address = null,
}) {
  if (!tenant_id || !action) {
    const err = new Error('tenant_id and action are required');
    err.statusCode = 500;
    throw err;
  }
  await AuditLog.create({
    tenant_id,
    actor_client_id: actor_client_id || null,
    action,
    resource_type: resource_type || null,
    resource_id: resource_id || null,
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
    ip_address: ip_address || null,
  });
}

/**
 * List audit logs for a tenant with optional filters and pagination.
 * @param {string} tenantId
 * @param {Object} options
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.from_date] - ISO date string (inclusive)
 * @param {string} [options.to_date] - ISO date string (inclusive)
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 */
async function listLogs(tenantId, options = {}) {
  const { action, from_date, to_date, email, page = 1, limit = 20 } = options;
  const where = { tenant_id: tenantId };

  if (action && typeof action === 'string' && action.trim()) {
    where.action = action.trim();
  }

  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) {
      const from = new Date(from_date);
      if (!isNaN(from.getTime())) where.created_at[Op.gte] = from;
    }
    if (to_date) {
      const to = new Date(to_date);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = to;
      }
    }
    if (Object.keys(where.created_at).length === 0) delete where.created_at;
  }

  if (email && typeof email === 'string' && email.trim()) {
    const emailHash = pseudonymizeEmail(tenantId, email);
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(
      sequelize.where(
        sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('metadata'), '$.email_hash')),
        emailHash
      )
    );
  }

  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * safeLimit;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: safeLimit,
    offset,
    attributes: [
      'id',
      'tenant_id',
      'actor_client_id',
      'action',
      'resource_type',
      'resource_id',
      'metadata',
      'ip_address',
      'created_at',
    ],
  });

  return {
    logs: rows.map((r) => r.toJSON()),
    pagination: {
      page: offset / safeLimit + 1,
      limit: safeLimit,
      total: count,
      total_pages: Math.ceil(count / safeLimit) || 1,
    },
  };
}

module.exports = { logAction, listLogs };
