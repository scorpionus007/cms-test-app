require('dotenv').config();
const { sequelize } = require('../models');

async function ensureClientsNameColumn() {
  const [rows] = await sequelize.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'name'"
  );
  if (rows && rows.length > 0) return;
  await sequelize.query("ALTER TABLE clients ADD COLUMN name VARCHAR(150) NULL AFTER tenant_id");
  console.log('Added clients.name column.');
}

async function ensureAuditLogIdIsUuid() {
  const [rows] = await sequelize.query(
    "SELECT DATA_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'id'"
  );
  if (!rows || rows.length === 0) return;
  const dataType = (rows[0].DATA_TYPE || '').toLowerCase();
  if (dataType === 'char' || dataType === 'varchar') return;
  const extra = (rows[0].EXTRA || '').toLowerCase();
  const hasAutoIncrement = extra.includes('auto_increment');
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await sequelize.query("TRUNCATE TABLE audit_logs");
  if (hasAutoIncrement) {
    await sequelize.query("ALTER TABLE audit_logs MODIFY COLUMN id INT NOT NULL");
  }
  await sequelize.query("ALTER TABLE audit_logs DROP PRIMARY KEY");
  await sequelize.query("ALTER TABLE audit_logs MODIFY COLUMN id CHAR(36) NOT NULL");
  await sequelize.query("ALTER TABLE audit_logs ADD PRIMARY KEY (id)");
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log('Fixed audit_logs.id to UUID (CHAR(36)).');
}

async function syncDb() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await ensureClientsNameColumn();
    await ensureAuditLogIdIsUuid();
    console.log('Database synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  }
}

syncDb();
