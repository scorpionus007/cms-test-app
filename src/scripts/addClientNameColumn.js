/**
 * One-time fix: add `name` column to clients table if missing.
 * Run: node src/scripts/addClientNameColumn.js
 * (Or use npm run db:sync to sync all models.)
 */
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { sequelize } = require('../models');

async function addColumn() {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'name'"
    );
    if (rows && rows.length > 0) {
      console.log('Column clients.name already exists. Nothing to do.');
      process.exit(0);
      return;
    }
    await sequelize.query(
      "ALTER TABLE clients ADD COLUMN name VARCHAR(150) NULL AFTER tenant_id"
    );
    console.log('Added column clients.name successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addColumn();
