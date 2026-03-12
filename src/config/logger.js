/**
 * Winston logger: console + optional file, configurable level.
 * LOG_LEVEL=error|warn|info|debug (default: info in prod, debug in dev)
 * LOG_DIR=logs (optional; if set, writes combined.log and error.log)
 */
const path = require('path');
require('dotenv').config();
const winston = require('winston');

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const logDir = process.env.LOG_DIR || '';

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.colorize({ all: process.env.NODE_ENV !== 'production' }),
      winston.format.printf(({ level: lvl, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
        return stack ? `${timestamp} ${lvl}: ${message}\n${stack}${metaStr}` : `${timestamp} ${lvl}: ${message}${metaStr}`;
      })
    ),
  }),
];

if (logDir && process.env.NODE_ENV !== 'test') {
  const fs = require('fs');
  const logsPath = path.isAbsolute(logDir) ? logDir : path.resolve(process.cwd(), logDir);
  try {
    fs.mkdirSync(logsPath, { recursive: true });
  } catch (_) {}
  transports.push(
    new winston.transports.File({ filename: path.join(logsPath, 'combined.log'), level: 'debug' }),
    new winston.transports.File({ filename: path.join(logsPath, 'error.log'), level: 'error' })
  );
}

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'securedapp-cms' },
  transports,
});

module.exports = logger;
