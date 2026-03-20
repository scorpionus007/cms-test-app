const auditService = require('../services/audit.service');

/**
 * GET /audit-logs
 * Query: action, from_date, to_date, page, limit
 */
async function list(req, res, next) {
  try {
    const { action, from_date, to_date, email, page, limit } = req.query;
    const result = await auditService.listLogs(req.user.tenant_id, {
      action,
      from_date,
      to_date,
      email,
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
};
