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

/**
 * Get all indexes for a table. Returns { indexName: [ columns (sorted, lowercased) ], isUnique }.
 */
async function getTableIndexes(tableName) {
  const [rows] = await sequelize.query(
    `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE 
     FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? 
     ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
    { replacements: [tableName] }
  );
  if (!rows || rows.length === 0) return {};
  const byIndex = {};
  for (const r of rows) {
    const name = r.INDEX_NAME;
    if (!byIndex[name]) byIndex[name] = { columns: [], nonUnique: r.NON_UNIQUE };
    byIndex[name].columns.push(r.COLUMN_NAME.toLowerCase());
  }
  for (const entry of Object.values(byIndex)) {
    entry.columns.sort();
    entry.isUnique = entry.nonUnique === 0;
  }
  return byIndex;
}

/**
 * Fix tables that must allow multiple rows per tenant/app: drop unique indexes that are only on
 * tenant_id or only on app_id (or other bad patterns), and ensure the expected composite unique exists.
 * config: {
 *   tableName,
 *   dropUniqueIfSingleColumn: ['tenant_id', 'app_id', ...],
 *   dropUniqueIfColumns: [ ['tenant_id','version_label'], ... ]  optional: drop unique with exactly these columns
 *   compositeUnique: ['tenant_id','name'] or ['app_id','version_label']
 * }
 */
async function ensureCompositeUnique(config) {
  const { tableName, dropUniqueIfSingleColumn = [], compositeUnique, dropUniqueIfColumns = [] } = config;
  const byIndex = await getTableIndexes(tableName);
  if (Object.keys(byIndex).length === 0) return;

  const compositeSorted = compositeUnique.map((c) => c.toLowerCase()).sort();
  const badColumnSets = dropUniqueIfColumns.map((arr) => arr.map((c) => c.toLowerCase()).sort());

  for (const [indexName, info] of Object.entries(byIndex)) {
    if (indexName === 'PRIMARY') continue;
    if (!info.isUnique) continue;
    const cols = info.columns;
    let shouldDrop = false;
    if (cols.length === 1 && dropUniqueIfSingleColumn.includes(cols[0])) {
      shouldDrop = true;
    } else if (badColumnSets.some((bad) => bad.length === cols.length && bad.every((c, i) => c === cols[i]))) {
      shouldDrop = true;
    }
    if (shouldDrop) {
      await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
      console.log(`Dropped ${tableName} unique index ${indexName} (columns: ${cols.join(', ')})`);
    }
  }

  // Re-fetch after possible drops
  const byIndexAfter = await getTableIndexes(tableName);
  const hasComposite = Object.values(byIndexAfter).some(
    (info) => info.isUnique && info.columns.length === compositeSorted.length && info.columns.every((c, i) => c === compositeSorted[i])
  );
  if (!hasComposite) {
    const indexCols = compositeUnique.join(', ');
    const indexName = `${tableName}_${compositeUnique.join('_')}_unique`.replace(/,/g, '');
    await sequelize.query(`ALTER TABLE \`${tableName}\` ADD UNIQUE INDEX \`${indexName}\` (${indexCols})`);
    console.log(`Added ${tableName} composite unique index (${indexCols}).`);
  }
}

/**
 * Purposes: multiple per tenant; unique on (tenant_id, name).
 */
async function ensurePurposesCompositeUnique() {
  await ensureCompositeUnique({
    tableName: 'purposes',
    dropUniqueIfSingleColumn: ['tenant_id'],
    compositeUnique: ['tenant_id', 'name'],
  });
}

/**
 * Consents: strictly app-wise; unique on (tenant_id, app_id, user_id, purpose_id).
 * Drop any unique that omits app_id (e.g. tenant_id + user_id + purpose_id) so same user can consent per app.
 */
async function ensureConsentsCompositeUnique() {
  await ensureCompositeUnique({
    tableName: 'consents',
    dropUniqueIfSingleColumn: ['tenant_id', 'app_id'],
    dropUniqueIfColumns: [
      ['tenant_id', 'user_id', 'purpose_id'],
      ['user_id', 'purpose_id'],
    ],
    compositeUnique: ['tenant_id', 'app_id', 'user_id', 'purpose_id'],
  });
}

/**
 * Consent state cache: same as consents; strictly app-wise.
 */
async function ensureConsentStateCacheCompositeUnique() {
  await ensureCompositeUnique({
    tableName: 'consent_state_cache',
    dropUniqueIfSingleColumn: ['tenant_id', 'app_id'],
    dropUniqueIfColumns: [
      ['tenant_id', 'user_id', 'purpose_id'],
      ['user_id', 'purpose_id'],
    ],
    compositeUnique: ['tenant_id', 'app_id', 'user_id', 'purpose_id'],
  });
}

/**
 * Apps: multiple per tenant; unique on (tenant_id, slug).
 */
async function ensureAppsCompositeUnique() {
  await ensureCompositeUnique({
    tableName: 'apps',
    dropUniqueIfSingleColumn: ['tenant_id'],
    compositeUnique: ['tenant_id', 'slug'],
  });
}

/**
 * Clients: multiple per tenant; unique on (tenant_id, email).
 */
async function ensureClientsCompositeUnique() {
  await ensureCompositeUnique({
    tableName: 'clients',
    dropUniqueIfSingleColumn: ['tenant_id'],
    compositeUnique: ['tenant_id', 'email'],
  });
}

/**
 * Policy versions: strictly per app; unique on (app_id, version_label).
 * Drop any unique on version_label only or (tenant_id, version_label) so same label (e.g. "1.0") is allowed per app.
 */
async function ensurePolicyVersionsCompositeUnique() {
  await ensureCompositeUnique({
    tableName: 'policy_versions',
    dropUniqueIfSingleColumn: ['app_id', 'tenant_id', 'version_label'],
    dropUniqueIfColumns: [['tenant_id', 'version_label']],
    compositeUnique: ['app_id', 'version_label'],
  });
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

/**
 * Legacy cleanup: in some environments api_keys accumulated duplicate indexes on `key`
 * due to repeated alter sync with overlapping unique definitions.
 */
async function cleanupApiKeysDuplicateKeyIndexes() {
  const [rows] = await sequelize.query(
    `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_keys'
     ORDER BY INDEX_NAME, SEQ_IN_INDEX`
  );
  if (!rows || rows.length === 0) return;

  const byIndex = {};
  for (const r of rows) {
    const idx = r.INDEX_NAME;
    if (!byIndex[idx]) byIndex[idx] = { columns: [], nonUnique: r.NON_UNIQUE };
    byIndex[idx].columns.push(String(r.COLUMN_NAME).toLowerCase());
  }

  const singleKeyIndexes = Object.entries(byIndex)
    .filter(([name, info]) => name !== 'PRIMARY' && info.columns.length === 1 && info.columns[0] === 'key')
    .map(([name, info]) => ({ name, isUnique: info.nonUnique === 0 }));

  if (singleKeyIndexes.length <= 1) return;

  const uniqueKeyIndexes = singleKeyIndexes.filter((i) => i.isUnique);
  // Keep one unique index and drop all extra single-column indexes on `key`.
  const keepName = uniqueKeyIndexes.length > 0 ? uniqueKeyIndexes[0].name : singleKeyIndexes[0].name;
  const toDrop = singleKeyIndexes.filter((i) => i.name !== keepName);

  for (const idx of toDrop) {
    await sequelize.query(`ALTER TABLE \`api_keys\` DROP INDEX \`${idx.name}\``);
    console.log(`Dropped duplicate api_keys index ${idx.name}.`);
  }
}

/**
 * Generic cleanup for duplicate single-column indexes generated by repeated alter sync.
 */
async function cleanupDuplicateSingleColumnIndexes(tableName, columnName) {
  const [rows] = await sequelize.query(
    `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
    { replacements: [tableName] }
  );
  if (!rows || rows.length === 0) return;

  const targetCol = String(columnName).toLowerCase();
  const byIndex = {};
  for (const r of rows) {
    const idx = r.INDEX_NAME;
    if (!byIndex[idx]) byIndex[idx] = { columns: [], nonUnique: r.NON_UNIQUE };
    byIndex[idx].columns.push(String(r.COLUMN_NAME).toLowerCase());
  }

  const candidateIndexes = Object.entries(byIndex)
    .filter(([name, info]) => name !== 'PRIMARY' && info.columns.length === 1 && info.columns[0] === targetCol)
    .map(([name, info]) => ({ name, isUnique: info.nonUnique === 0 }));

  if (candidateIndexes.length <= 1) return;

  const uniqueIndexes = candidateIndexes.filter((i) => i.isUnique);
  const keepName = uniqueIndexes.length > 0 ? uniqueIndexes[0].name : candidateIndexes[0].name;
  const toDrop = candidateIndexes.filter((i) => i.name !== keepName);

  for (const idx of toDrop) {
    await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${idx.name}\``);
    console.log(`Dropped duplicate ${tableName} index ${idx.name}.`);
  }
}

/**
 * Full schema sync + index fixes. Used by CLI (`npm run db:sync`) and dev server auto-sync.
 * @throws {Error} on connection or migration failure
 */
async function syncDatabase() {
  await sequelize.authenticate();
  await cleanupDuplicateSingleColumnIndexes('api_keys', 'key');
  await cleanupDuplicateSingleColumnIndexes('data_catalog', 'data_id');
  await cleanupApiKeysDuplicateKeyIndexes();
  await sequelize.sync({ alter: true });
  await ensureClientsNameColumn();
  await ensurePurposesCompositeUnique();
  await ensureConsentsCompositeUnique();
  await ensureConsentStateCacheCompositeUnique();
  await ensureAppsCompositeUnique();
  await ensureClientsCompositeUnique();
  await ensurePolicyVersionsCompositeUnique();
  await ensureAuditLogIdIsUuid();
  console.log('Database synced successfully.');
}

async function runSyncCli() {
  try {
    await syncDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runSyncCli();
}

module.exports = { syncDatabase };
