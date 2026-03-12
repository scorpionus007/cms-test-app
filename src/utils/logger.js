/**
 * Domain log helpers. Uses main Winston logger when available.
 */
const mainLogger = require('../config/logger');

const logOnboarding = (event, data) => {
  mainLogger.info('onboarding', { event, ...data });
};

module.exports = { logOnboarding };
