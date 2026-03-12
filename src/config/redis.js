/**
 * Redis connection for BullMQ (webhook queue).
 * Redis is off by default; set REDIS_ENABLED=true and start Redis to use webhooks.
 * When enabled: REDIS_HOST, REDIS_PORT (defaults 127.0.0.1, 6379).
 */
require('dotenv').config();
const IORedis = require('ioredis');

const enabled = process.env.REDIS_ENABLED === 'true';
const host = process.env.REDIS_HOST || '127.0.0.1';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);

let connection = null;
let lastErrorLog = 0;

if (enabled) {
  connection = new IORedis({
    host,
    port,
    maxRetriesPerRequest: null,
    lazyConnect: true, // do not connect on require(); connect on first use
  });

  connection.on('error', (err) => {
    if (process.env.NODE_ENV === 'test') return;
    const now = Date.now();
    if (now - lastErrorLog > 10000) {
      try {
        const logger = require('./logger');
        logger.warn('Redis connection error (further errors suppressed for 10s)', { error: err.message });
      } catch (_) {
        // eslint-disable-next-line no-console
        console.warn('Redis connection error:', err.message);
      }
      lastErrorLog = now;
    }
  });
}

module.exports = connection;
