/**
 * Clears all data from the database (truncates tables).
 * Use for development/reset only. Run: npm run db:clear
 *
 * Requires confirmation in non-CI: set env CLEAR_DB_CONFIRM=yes to skip prompt.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize } = require('../models');

const TABLES = [
  'consent_events',
  'consent_state_cache',
  'consents',
  'dsr_events',
  'dsr_requests',
  'purposes',
  'policy_versions',
  'api_keys',
  'clients',
  'webhook_deliveries',
  'webhooks',
  'audit_logs',
  'breach_reports',
  'tenants',
];

async function clearDb() {
  const confirm = process.env.CLEAR_DB_CONFIRM === 'yes';
  if (!confirm && process.env.NODE_ENV !== 'test') {
    console.error('To clear all DB data, run: CLEAR_DB_CONFIRM=yes npm run db:clear');
    console.error('(Or set CLEAR_DB_CONFIRM=yes in .env for this run.)');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLES) {
      try {
        await sequelize.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  truncated ${table}`);
      } catch (err) {
        if (err.message && (err.message.includes("doesn't exist") || err.message.includes('Unknown table'))) {
          console.log(`  skip ${table} (table not found)`);
        } else {
          throw err;
        }
      }
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Database cleared.');
  } catch (err) {
    console.error('Clear failed:', err.message);
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (_) {}
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

clearDb();
