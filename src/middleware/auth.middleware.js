/**
 * Auth middleware: JWT authentication, scope-based authorization, Google login validation.
 */
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET;

// ----- JWT authentication -----

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function authenticate(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }

  if (!JWT_SECRET) {
    const err = new Error('Server configuration error');
    err.statusCode = 500;
    return next(err);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      complete: false,
    });
  } catch (err) {
    const e = new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    e.statusCode = 401;
    e.cause = err;
    return next(e);
  }

  if (!decoded || typeof decoded !== 'object') {
    const err = new Error('Invalid token');
    err.statusCode = 401;
    return next(err);
  }

  const tenant_id = decoded.tenant_id;
  const client_id = decoded.client_id;
  const email = decoded.email;
  const name = decoded.name || null;
  const role = decoded.role || null;
  const scopes = Array.isArray(decoded.scopes) ? decoded.scopes : [];
  const onboarding = decoded.onboarding === true;

  if (onboarding) {
    if (!email) {
      const err = new Error('Invalid token payload');
      err.statusCode = 401;
      return next(err);
    }
    req.user = { email, name, onboarding: true };
    return next();
  }

  if (!tenant_id || !client_id) {
    const err = new Error('Invalid token payload');
    err.statusCode = 401;
    return next(err);
  }

  req.user = { tenant_id, client_id, email: email || null, name, role, scopes };
  next();
}

/** Require that the user has completed onboarding (has tenant_id). Use after authenticate. */
function requireTenant(req, res, next) {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }
  if (req.user.onboarding || !req.user.tenant_id) {
    const err = new Error('Tenant onboarding required');
    err.statusCode = 403;
    return next(err);
  }
  next();
}

/** Require one of the given roles. Use after authenticate + requireTenant. */
function requireRole(...allowedRoles) {
  const set = new Set(allowedRoles.map((r) => String(r).trim()).filter(Boolean));
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      const err = new Error('Insufficient permissions');
      err.statusCode = 403;
      return next(err);
    }
    if (!set.has(req.user.role)) {
      const err = new Error('Insufficient permissions');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}

// ----- Scope-based authorization -----

function authorize(...allowedScopes) {
  if (allowedScopes.length === 0) {
    const err = new Error('authorize() requires at least one scope');
    err.statusCode = 500;
    throw err;
  }
  const set = new Set(allowedScopes.map((s) => String(s).trim()).filter(Boolean));

  return function scopeAuthorize(req, res, next) {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      return next(err);
    }
    const userScopes = Array.isArray(req.user.scopes) ? req.user.scopes : [];
    const hasScope = userScopes.some((scope) => set.has(scope));
    if (!hasScope) {
      const err = new Error('Insufficient permissions');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}

// ----- Google login validation -----

const googleLoginValidation = [
  body('googleToken')
    .exists({ checkFalsy: true })
    .withMessage('googleToken is required')
    .isString()
    .withMessage('googleToken must be a string')
    .trim()
    .isLength({ min: 50, max: 8000 })
    .withMessage('googleToken must be a valid token'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array().map((e) => e.msg).join('; '));
    err.statusCode = 400;
    err.validationErrors = errors.array();
    return next(err);
  }
  next();
}

module.exports = {
  authenticate,
  getTokenFromRequest,
  requireTenant,
  requireRole,
  authorize,
  googleLoginValidation,
  handleValidationErrors,
};
