/**
 * Security middleware: Helmet, CORS.
 * Mitigates OWASP A05 (Security Misconfiguration), A04 (Insecure Design).
 */
const helmet = require('helmet');
const cors = require('cors');

const isProduction = process.env.NODE_ENV === 'production';

const helmetOptions = {
  contentSecurityPolicy: isProduction,
  crossOriginEmbedderPolicy: isProduction,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

function securityMiddleware(app) {
  app.use(helmet(helmetOptions));

  const corsOptions = {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : (isProduction ? false : true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
}

// We need to apply json() in app.js before routes; helmet/cors can be applied here.
// Export both so app can use: securityMiddleware sets helmet+cors, and we export json limit.
const JSON_BODY_LIMIT = '100kb';

module.exports = { securityMiddleware, helmet, cors, JSON_BODY_LIMIT };
