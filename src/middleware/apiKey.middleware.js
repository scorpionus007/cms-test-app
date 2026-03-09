const { ApiKey } = require('../models');

const API_KEY_HEADER = 'x-api-key';

/**
 * Authenticate request using API key.
 * Reads x-api-key header, validates key exists and is active, attaches req.tenant = { id: tenant_id }.
 * Does NOT use JWT; for public CMS / external integration.
 */
async function authenticateApiKey(req, res, next) {
  const key = req.headers[API_KEY_HEADER] || req.headers['X-Api-Key'];
  if (!key || typeof key !== 'string' || !key.trim()) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const trimmedKey = key.trim();
  const apiKey = await ApiKey.findOne({
    where: { key: trimmedKey, active: true },
    attributes: ['tenant_id'],
  });

  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.tenant = { id: apiKey.tenant_id };
  next();
}

module.exports = {
  authenticateApiKey,
  API_KEY_HEADER,
};
