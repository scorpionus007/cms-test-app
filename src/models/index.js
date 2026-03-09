const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: process.env.NODE_ENV === 'production'
      ? { ssl: { require: true, rejectUnauthorized: true } }
      : {},
  }
);

const db = {
  sequelize,
  Sequelize,
  Tenant: require('./tenant')(sequelize),
  Client: require('./client')(sequelize),
  Purpose: require('./purpose')(sequelize),
  PolicyVersion: require('./policyVersion')(sequelize),
  Consent: require('./consent')(sequelize),
  ConsentEvent: require('./consentEvent')(sequelize),
  ConsentStateCache: require('./consentStateCache')(sequelize),
  Webhook: require('./webhook')(sequelize),
  WebhookDelivery: require('./webhookDelivery')(sequelize),
  DsrRequest: require('./dsrRequest')(sequelize),
  DsrEvent: require('./dsrEvent')(sequelize),
  AuditLog: require('./auditLog')(sequelize),
  BreachReport: require('./breachReport')(sequelize),
  ApiKey: require('./apiKey')(sequelize),
};

// Tenant -> Client
db.Tenant.hasMany(db.Client, { foreignKey: 'tenant_id' });
db.Client.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });

// Tenant -> Purpose, PolicyVersion, Webhook, AuditLog, BreachReport
db.Tenant.hasMany(db.Purpose, { foreignKey: 'tenant_id' });
db.Purpose.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Tenant.hasMany(db.PolicyVersion, { foreignKey: 'tenant_id' });
db.PolicyVersion.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Tenant.hasMany(db.Webhook, { foreignKey: 'tenant_id' });
db.Webhook.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Webhook.hasMany(db.WebhookDelivery, { foreignKey: 'webhook_id' });
db.WebhookDelivery.belongsTo(db.Webhook, { foreignKey: 'webhook_id' });
db.Tenant.hasMany(db.AuditLog, { foreignKey: 'tenant_id' });
db.AuditLog.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Tenant.hasMany(db.BreachReport, { foreignKey: 'tenant_id' });
db.BreachReport.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Tenant.hasMany(db.ApiKey, { foreignKey: 'tenant_id' });
db.ApiKey.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });

// Purpose -> Consent; PolicyVersion -> ConsentEvent
db.Purpose.hasMany(db.Consent, { foreignKey: 'purpose_id' });
db.Consent.belongsTo(db.Purpose, { foreignKey: 'purpose_id' });
db.Tenant.hasMany(db.Consent, { foreignKey: 'tenant_id' });
db.Consent.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Consent.hasMany(db.ConsentEvent, { foreignKey: 'consent_id' });
db.ConsentEvent.belongsTo(db.Consent, { foreignKey: 'consent_id' });
db.PolicyVersion.hasMany(db.ConsentEvent, { foreignKey: 'policy_version_id' });
db.ConsentEvent.belongsTo(db.PolicyVersion, { foreignKey: 'policy_version_id' });

// Consent state cache (read-optimized; source of truth remains consent_events)
db.Tenant.hasMany(db.ConsentStateCache, { foreignKey: 'tenant_id' });
db.ConsentStateCache.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.Purpose.hasMany(db.ConsentStateCache, { foreignKey: 'purpose_id' });
db.ConsentStateCache.belongsTo(db.Purpose, { foreignKey: 'purpose_id' });
db.PolicyVersion.hasMany(db.ConsentStateCache, { foreignKey: 'policy_version_id' });
db.ConsentStateCache.belongsTo(db.PolicyVersion, { foreignKey: 'policy_version_id' });

// DSR
db.Tenant.hasMany(db.DsrRequest, { foreignKey: 'tenant_id' });
db.DsrRequest.belongsTo(db.Tenant, { foreignKey: 'tenant_id' });
db.DsrRequest.hasMany(db.DsrEvent, { foreignKey: 'dsr_id' });
db.DsrEvent.belongsTo(db.DsrRequest, { foreignKey: 'dsr_id' });

module.exports = db;
