/**
 * HTTP request logging middleware. Logs method, url, status, duration, and optionally tenant/user.
 */
const logger = require('../config/logger');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const ip = getClientIp(req);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      ip,
    };
    if (req.user?.tenant_id) meta.tenant_id = req.user.tenant_id;
    if (req.user?.client_id) meta.client_id = req.user.client_id;

    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`, meta);
    } else {
      logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`, meta);
    }
  });

  next();
}

module.exports = { requestLogger };
