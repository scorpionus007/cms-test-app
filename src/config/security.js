/**
 * Security configuration: rate limits (configurable via env), CORS, etc.
 * OWASP-aligned defaults.
 */
const rateLimit = require('express-rate-limit');

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) || 15 * 60 * 1000; // 15 min default
const MAX_GENERAL = parseInt(process.env.RATE_LIMIT_MAX_GENERAL || '200', 10) || 200;
const MAX_AUTH = parseInt(process.env.RATE_LIMIT_MAX_AUTH || '10', 10) || 10;
const MAX_PUBLIC = parseInt(process.env.RATE_LIMIT_MAX_PUBLIC || '60', 10) || 60; // public/API-key routes per window

const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_GENERAL,
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_AUTH,
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_PUBLIC,
  message: { error: 'Too many requests to this endpoint. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  publicLimiter,
  WINDOW_MS,
  MAX_GENERAL,
  MAX_AUTH,
  MAX_PUBLIC,
};
