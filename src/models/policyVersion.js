const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PolicyVersion = sequelize.define(
    'PolicyVersion',
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
        comment: 'Policy is scoped per app; null for legacy rows until backfill',
      },
      version_label: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      policy_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      document_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'SHA-256 hash of policy_text',
      },
      effective_from: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'policy_versions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['app_id'] },
        { unique: true, fields: ['app_id', 'version_label'] },
      ],
    }
  );
  return PolicyVersion;
};
