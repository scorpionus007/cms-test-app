require('dotenv').config();
const logger = require('./config/logger');

/**
 * `npm run dev` only: run the same logic as `npm run db:sync` before listening.
 * Skip with SKIP_DB_SYNC=true. `npm start` never auto-syncs.
 */
async function maybeSyncDatabaseForDev() {
  const isNpmDev = process.env.npm_lifecycle_event === 'dev';
  const skip = process.env.SKIP_DB_SYNC === 'true' || process.env.SKIP_DB_SYNC === '1';
  if (!isNpmDev || skip) return;
  const { syncDatabase } = require('./scripts/syncDb');
  await syncDatabase();
  logger.info('Database synced (npm run dev auto-sync).');
}

(async () => {
  try {
    await maybeSyncDatabaseForDev();
  } catch (err) {
    logger.error('Database sync failed — fix DB config or run `npm run db:sync` manually.', err);
    process.exit(1);
  }

  const app = require('./app');
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
})();
