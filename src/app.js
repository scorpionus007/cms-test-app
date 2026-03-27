const express = require('express');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const clientRoutes = require('./routes/client.routes');
const auditRoutes = require('./routes/audit.routes');
const purposeRoutes = require('./routes/purpose.routes');
const dataCatalogRoutes = require('./routes/dataCatalog.routes');
const webhookRoutes = require('./routes/webhook.routes');
const dsrRoutes = require('./routes/dsr.routes');
const appsRoutes = require('./routes/apps.routes');
const publicRoutes = require('./routes/public.routes');
const cors = require('cors');
const swaggerSpec = require('./config/swagger');
const { securityMiddleware, JSON_BODY_LIMIT } = require('./middleware/security');
const { generalLimiter } = require('./config/security');
const { requestLogger } = require('./middleware/requestLogger');
const logger = require('./config/logger');

const app = express();

securityMiddleware(app);

// CORS: allow frontend / test origins. Set CORS_ORIGIN (comma-separated) in production.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://localhost:5501',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
  ];
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(requestLogger);
app.use(generalLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SecureDApp CMS API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true,
  },
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.get('/api-docs/paths', (req, res) => res.json({ count: Object.keys(swaggerSpec.paths || {}).length, paths: Object.keys(swaggerSpec.paths || {}) }));

app.use('/auth', authRoutes);
app.use('/tenant', tenantRoutes);
app.use('/clients', clientRoutes);
app.use('/audit-logs', auditRoutes);
app.use('/purposes', purposeRoutes);
app.use('/data-catalog', dataCatalogRoutes);
app.use('/webhooks', webhookRoutes);
// Consent is per app: mount at /apps/:appId so req.params.appId is set
app.use('/apps/:appId', appsRoutes);
app.use('/dsr', dsrRoutes);   // POST /dsr/request only (public, app_id in body); admin DSR under /tenant/apps/:appId/dsr
app.use('/public', publicRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  if (status >= 500) {
    logger.error(err.message || err, { stack: err.stack, url: req.originalUrl, method: req.method });
  } else {
    logger.warn(err.message || err, { status, url: req.originalUrl });
  }
  const message = status >= 500 && isProduction ? 'Internal server error' : (err.message || 'Internal server error');
  const body = { error: message };
  if (!isProduction && err.stack) body.stack = err.stack;
  res.status(status).json(body);
});

module.exports = app;
