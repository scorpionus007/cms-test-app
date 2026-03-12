/**
 * BullMQ queue for webhook delivery. API adds jobs; worker processes them.
 * Null when Redis is disabled (REDIS_ENABLED=false) or connection not available.
 */
const { Queue } = require('bullmq');
const connection = require('../config/redis');

const QUEUE_NAME = 'webhooks';

const webhookQueue = connection
  ? new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 min, then 2, 4, 8, 16 min
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: false, // keep failed jobs for dead-letter inspection
      },
    })
  : null;

module.exports = webhookQueue;
