/**
 * Data Subject Request (DSR) service: submit, list, update status, export, erasure.
 * Supports DPDP/GDPR rights: access, erasure, rectification.
 */
const {
  DsrRequest,
  DsrEvent,
  Consent,
  ConsentEvent,
  ConsentStateCache,
  Purpose,
  PolicyVersion,
  AuditLog,
  sequelize,
} = require('../models');
const auditService = require('./audit.service');
const webhookDispatcher = require('./webhookDispatcher.service');

const REQUEST_TYPES = ['access', 'erasure', 'rectification'];
const STATUSES = ['pending', 'processing', 'completed', 'rejected'];

/**
 * Submit DSR (public, API key). Creates request with status pending. App-scoped.
 */
async function submitRequest(tenantId, appId, body, ipAddress = null) {
  const user_id = body.user_id != null && typeof body.user_id === 'string' ? body.user_id.trim() : '';
  const type = body.type || body.request_type;
  if (!appId) {
    const err = new Error('app_id is required');
    err.statusCode = 400;
    throw err;
  }
  if (!user_id) {
    const err = new Error('user_id is required');
    err.statusCode = 400;
    throw err;
  }
  if (!type || !REQUEST_TYPES.includes(type)) {
    const err = new Error('type must be one of: access, erasure, rectification');
    err.statusCode = 400;
    throw err;
  }

  const request = await DsrRequest.create({
    tenant_id: tenantId,
    app_id: appId,
    user_id,
    request_type: type,
    status: 'pending',
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: null,
    action: 'DSR_REQUEST_CREATED',
    resource_type: 'dsr_request',
    resource_id: request.id,
    metadata: { user_id, request_type: type },
    ip_address: ipAddress,
  });

  return {
    id: request.id,
    user_id: request.user_id,
    request_type: request.request_type,
    status: request.status,
    created_at: request.created_at,
  };
}

/**
 * List DSR requests for app (admin).
 */
async function listRequests(tenantId, appId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));
  const { status, request_type } = options;
  const where = { tenant_id: tenantId, app_id: appId };
  if (status && STATUSES.includes(status)) where.status = status;
  if (request_type && REQUEST_TYPES.includes(request_type)) where.request_type = request_type;

  const { rows, count } = await DsrRequest.findAndCountAll({
    where,
    attributes: ['id', 'user_id', 'request_type', 'status', 'created_at'],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    requests: rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      request_type: r.request_type,
      status: r.status,
      created_at: r.created_at,
    })),
    pagination: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit) || 1,
    },
  };
}

/**
 * Update DSR status and append lifecycle event. On completed erasure, run erasure automation. App-scoped.
 */
async function updateStatus(tenantId, appId, dsrId, body, actorClientId, ipAddress = null) {
  const request = await DsrRequest.findOne({
    where: { id: dsrId, tenant_id: tenantId, app_id: appId },
  });
  if (!request) {
    const err = new Error('DSR request not found');
    err.statusCode = 404;
    throw err;
  }

  const newStatus = body.status && STATUSES.includes(body.status) ? body.status : null;
  if (!newStatus) {
    const err = new Error('status must be one of: pending, processing, completed, rejected');
    err.statusCode = 400;
    throw err;
  }

  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : null;
  const previousStatus = request.status;
  await request.update({ status: newStatus });

  await DsrEvent.create({
    dsr_id: request.id,
    status: newStatus,
    metadata: metadata || { processed_by: actorClientId },
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'DSR_STATUS_UPDATED',
    resource_type: 'dsr_request',
    resource_id: request.id,
    metadata: { previous_status: previousStatus, new_status: newStatus, user_id: request.user_id },
    ip_address: ipAddress,
  });

  if (newStatus === 'completed' && request.request_type === 'erasure') {
    await executeErasure(tenantId, appId, request.user_id, request.id, actorClientId, ipAddress);
    webhookDispatcher.dispatch({
      event: 'dsr.completed',
      tenant_id: tenantId,
      payload: { user_id: request.user_id, type: request.request_type },
    });
  } else if (newStatus === 'completed') {
    webhookDispatcher.dispatch({
      event: 'dsr.completed',
      tenant_id: tenantId,
      payload: { user_id: request.user_id, type: request.request_type },
    });
  }

  return {
    id: request.id,
    user_id: request.user_id,
    request_type: request.request_type,
    status: request.status,
    created_at: request.created_at,
  };
}

/**
 * Export all data for a user (access request). App-scoped.
 */
async function exportData(tenantId, appId, dsrId, actorClientId, ipAddress = null) {
  const request = await DsrRequest.findOne({
    where: { id: dsrId, tenant_id: tenantId, app_id: appId },
  });
  if (!request) {
    const err = new Error('DSR request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.request_type !== 'access') {
    const err = new Error('Export is only available for access requests');
    err.statusCode = 400;
    throw err;
  }

  const userId = request.user_id;

  const consents = await Consent.findAll({
    where: { tenant_id: tenantId, app_id: appId, user_id: userId },
    attributes: ['id', 'user_id', 'purpose_id', 'created_at'],
  });

  const purposeIds = [...new Set(consents.map((c) => c.purpose_id))];
  const purposes = purposeIds.length
    ? await Purpose.findAll({
        where: { id: purposeIds, tenant_id: tenantId },
        attributes: ['id', 'name', 'description', 'required'],
      })
    : [];
  const purposeMap = new Map(purposes.map((p) => [p.id, p]));

  const consentIds = consents.map((c) => c.id);
  const events = consentIds.length
    ? await ConsentEvent.findAll({
        where: { consent_id: consentIds },
        attributes: ['id', 'consent_id', 'event_type', 'policy_version_id', 'created_at'],
        order: [['created_at', 'ASC']],
      })
    : [];

  const policyVersionIds = [...new Set(events.map((e) => e.policy_version_id).filter(Boolean))];
  const policyVersions = policyVersionIds.length
    ? await PolicyVersion.findAll({
        where: { id: policyVersionIds, tenant_id: tenantId },
        attributes: ['id', 'version_label', 'policy_text', 'effective_from', 'created_at'],
      })
    : [];

  const auditLogs = await AuditLog.findAll({
    where: { tenant_id: tenantId },
    attributes: ['id', 'action', 'resource_type', 'resource_id', 'metadata', 'created_at'],
    order: [['created_at', 'DESC']],
    limit: 500,
  });
  const userRelevantLogs = auditLogs.filter((log) => {
    const meta = log.metadata || {};
    return meta.user_id === userId || meta.user_id === userId;
  });

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'DSR_DATA_EXPORTED',
    resource_type: 'dsr_request',
    resource_id: request.id,
    metadata: { user_id: userId },
    ip_address: ipAddress,
  });

  return {
    user_id: userId,
    exported_at: new Date().toISOString(),
    consents: consents.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      purpose_id: c.purpose_id,
      purpose: purposeMap.get(c.purpose_id) ? purposeMap.get(c.purpose_id).toJSON() : null,
      created_at: c.created_at,
    })),
    events: events.map((e) => ({
      id: e.id,
      consent_id: e.consent_id,
      event_type: e.event_type,
      policy_version_id: e.policy_version_id,
      created_at: e.created_at,
    })),
    policy_versions: policyVersions.map((p) => p.toJSON()),
    audit_logs: userRelevantLogs.map((l) => ({
      id: l.id,
      action: l.action,
      resource_type: l.resource_type,
      resource_id: l.resource_id,
      metadata: l.metadata,
      created_at: l.created_at,
    })),
  };
}

/**
 * Execute erasure: delete user consent records (for this app), events, cache; anonymize audit logs.
 */
async function executeErasure(tenantId, appId, userId, dsrRequestId, actorClientId, ipAddress = null) {
  const transaction = await sequelize.transaction();
  try {
    const consents = await Consent.findAll({
      where: { tenant_id: tenantId, app_id: appId, user_id: userId },
      attributes: ['id'],
      transaction,
    });
    const consentIds = consents.map((c) => c.id);

    if (consentIds.length > 0) {
      await ConsentEvent.destroy({ where: { consent_id: consentIds }, transaction });
    }
    await ConsentStateCache.destroy({
      where: { tenant_id: tenantId, app_id: appId, user_id: userId },
      transaction,
    });
    await Consent.destroy({
      where: { tenant_id: tenantId, app_id: appId, user_id: userId },
      transaction,
    });

    await sequelize.query(
      `UPDATE audit_logs SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.user_id', 'deleted_user')
       WHERE tenant_id = :tenantId AND JSON_UNQUOTE(JSON_EXTRACT(COALESCE(metadata, '{}'), '$.user_id')) = :userId`,
      { replacements: { tenantId, userId }, transaction }
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  await auditService.logAction({
    tenant_id: tenantId,
    actor_client_id: actorClientId,
    action: 'DSR_ERASURE_EXECUTED',
    resource_type: 'dsr_request',
    resource_id: dsrRequestId,
    metadata: { user_id: userId, anonymized: true },
    ip_address: ipAddress,
  });
}

module.exports = {
  submitRequest,
  listRequests,
  updateStatus,
  exportData,
  executeErasure,
  REQUEST_TYPES,
  STATUSES,
};
