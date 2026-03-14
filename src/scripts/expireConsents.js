/**
 * Expire consents where expires_at < now and status = ACTIVE.
 * Run via cron every hour: node src/scripts/expireConsents.js
 * Or: npm run consent:expire
 */
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize, Consent } = require('../models');
const { Op } = require('sequelize');

async function expireConsents() {
  try {
    await sequelize.authenticate();
    const [updated] = await Consent.update(
      { status: 'EXPIRED' },
      {
        where: {
          status: 'ACTIVE',
          expires_at: { [Op.lt]: new Date() },
        },
      }
    );
    console.log(`Expired ${updated} consent(s).`);
  } catch (err) {
    console.error('Expire consents failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

expireConsents();
