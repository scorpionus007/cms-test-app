/**
 * Security middleware: Helmet.
 * CORS is disabled for now; re-enable via app.use(cors(...)) if needed.
 */
const helmet = require('helmet');

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
}

const JSON_BODY_LIMIT = '100kb';

module.exports = { securityMiddleware, helmet, JSON_BODY_LIMIT };
