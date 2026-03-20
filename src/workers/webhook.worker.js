/**
 * Webhook worker: process delivery jobs from BullMQ queue.
 * Sends POST with signed payload; records success in webhook_deliveries.
 * On final failure (all retries exhausted), records dead-letter in webhook_deliveries.
 */
require('dotenv').config();
const { Worker } = require('bullmq');
const axios = require('axios');
const connection = require('../config/redis');
const { signPayload } = require('../utils/webhookSigner');
const { WebhookDelivery } = require('../models');

if (!connection) {
  try {
    require('../config/logger').error('Redis is disabled. Set REDIS_ENABLED=true in .env and start Redis to run the webhook worker.');
  } catch (_) {
    // eslint-disable-next-line no-console
    console.error('Redis is disabled. Set REDIS_ENABLED=true in .env and start Redis to run the webhook worker.');
  }
  process.exit(1);
}

const QUEUE_NAME = 'webhooks';
const SIGNATURE_HEADER = 'x-webhook-signature';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';
const EVENT_HEADER = 'x-webhook-event';
const REQUEST_TIMEOUT_MS = 15000;

async function processJob(job) {
  const { webhook_id, url, secret, body } = job.data;
  if (!url || !body) {
    throw new Error('Missing url or body');
  }

  const payloadStr = JSON.stringify(body);
  const timestampSeconds = Math.floor(Date.now() / 1000);
  const { signatureHeader, timestamp } = signPayload(secret, payloadStr, timestampSeconds);

  const response = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER]: signatureHeader,
      [TIMESTAMP_HEADER]: timestamp,
      [EVENT_HEADER]: body.event || '',
    },
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true, // we check status ourselves
  });

  const success = response.status >= 200 && response.status < 300;
  if (success) {
    await WebhookDelivery.create({
      webhook_id,
      payload: body,
      status: 'success',
      response_code: response.status,
      retries: job.attemptsMade,
    });
    return;
  }
  // Non-2xx: do not record here; throw so BullMQ retries; dead-letter on final failure
  throw new Error(`Webhook returned ${response.status}`);
}

const worker = new Worker(
  QUEUE_NAME,
  processJob,
  {
    connection,
    concurrency: 5,
  }
);

const workerLogger = (() => {
  try {
    return require('../config/logger');
  } catch (_) {
    return null;
  }
})();

worker.on('completed', (job) => {
  if (process.env.NODE_ENV !== 'test' && workerLogger) {
    workerLogger.info('Webhook delivered', { jobId: job.id });
  }
});

worker.on('failed', async (job, err) => {
  if (process.env.NODE_ENV !== 'test' && workerLogger) {
    workerLogger.warn('Webhook job failed', { jobId: job?.id, error: err.message });
  }
  // Dead letter: record failure in DB when all retries exhausted
  if (job && job.attemptsMade >= (job.opts?.attempts ?? 5)) {
    try {
      const { webhook_id, body } = job.data;
      await WebhookDelivery.create({
        webhook_id,
        payload: body || null,
        status: 'failed',
        response_code: null,
        retries: job.attemptsMade,
      });
    } catch (e) {
      if (process.env.NODE_ENV !== 'test' && workerLogger) {
        workerLogger.error('Failed to record webhook delivery failure', { error: e.message });
      }
    }
  }
});

worker.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test' && workerLogger) {
    workerLogger.error('Webhook worker error', { error: err.message });
  }
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
