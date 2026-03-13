const apiKeyService = require('../services/apiKey.service');
const getClientIp = require('../utils/getClientIp');

/**
 * POST /tenant/api-keys - Create API key (owner/admin). Plain key returned only once.
 */
async function create(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const clientId = req.user.client_id;
    const result = await apiKeyService.createApiKey(tenantId, req.body, clientId, getClientIp(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tenant/api-keys - List API keys for tenant (key masked).
 */
async function list(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const keys = await apiKeyService.listApiKeys(tenantId);
    res.status(200).json({ api_keys: keys });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /tenant/api-keys/:id - Revoke API key (owner/admin).
 */
async function revoke(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const clientId = req.user.client_id;
    const keyId = req.params.id;
    await apiKeyService.revokeApiKey(tenantId, keyId, clientId, getClientIp(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  revoke,
};
