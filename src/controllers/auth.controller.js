const authService = require('../services/auth.service');
const auditService = require('../services/audit.service');

const getClientIp = require('../utils/getClientIp');

/**
 * POST /auth/google-login
 * Body: { googleToken: "google_id_token" }
 * Returns: { token, tenant_id?, client_id?, onboarding?, email, name? }
 */
async function googleLogin(req, res, next) {
  try {
    const { googleToken } = req.body;
    const result = await authService.googleLogin(googleToken);
    if (result.tenant_id && result.client_id) {
      await auditService.logAction({
        tenant_id: result.tenant_id,
        actor_client_id: result.client_id,
        action: 'CLIENT_LOGIN',
        resource_type: 'client',
        resource_id: result.client_id,
        metadata: { email: result.email },
        ip_address: getClientIp(req),
      });
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me
 * Returns: { client, tenant, permissions } for the logged-in user.
 */
async function getMe(req, res, next) {
  try {
    const result = await authService.getMe(
      req.user.tenant_id,
      req.user.client_id,
      req.user.scopes
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  googleLogin,
  getMe,
};
