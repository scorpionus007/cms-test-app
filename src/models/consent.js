const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Consent = sequelize.define(
    'Consent',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      app_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'apps', key: 'id' },
        comment: 'Consent is scoped per app; null for legacy until backfill',
      },
      user_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Pseudonymized user identifier (HMAC)',
      },
      purpose_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'purposes', key: 'id' },
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'policy_versions', key: 'id' },
        comment: 'Policy version at time of grant',
      },
      granted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'WITHDRAWN', 'EXPIRED'),
        allowNull: true,
        defaultValue: 'ACTIVE',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'consents',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['app_id'] },
        { unique: true, fields: ['tenant_id', 'app_id', 'user_id', 'purpose_id'] },
        { name: 'idx_consent_lookup', fields: ['tenant_id', 'app_id', 'user_id'] },
      ],
    }
  );
  return Consent;
};
