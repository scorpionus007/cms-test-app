const express = require('express');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const clientRoutes = require('./routes/client.routes');
const auditRoutes = require('./routes/audit.routes');
const consentReadRoutes = require('./routes/consentRead.routes');
const consentRoutes = require('./routes/consent.routes');
const purposeRoutes = require('./routes/purpose.routes');
const policyVersionRoutes = require('./routes/policyVersion.routes');
const webhookRoutes = require('./routes/webhook.routes');
const publicRoutes = require('./routes/public.routes');
const swaggerSpec = require('./config/swagger');
const { securityMiddleware, JSON_BODY_LIMIT } = require('./middleware/security');
const { generalLimiter } = require('./config/security');

const app = express();

securityMiddleware(app);

app.use(express.json({ limit: JSON_BODY_LIMIT }));
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
app.use('/consent', consentReadRoutes);
app.use('/consent', consentRoutes);
app.use('/purposes', purposeRoutes);
app.use('/policy-versions', policyVersionRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/public', publicRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    console.error(err);
  } else if (status >= 500) {
    console.error(err.message || err);
  }
  const message = status >= 500 && isProduction ? 'Internal server error' : (err.message || 'Internal server error');
  const body = { error: message };
  if (!isProduction && err.stack) body.stack = err.stack;
  res.status(status).json(body);
});

module.exports = app;
