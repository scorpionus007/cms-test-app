const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define(
    'AuditLog',
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
      actor_client_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Client who performed the action',
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      resource_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      resource_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'audit_logs',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] },
      ],
    }
  );
  return AuditLog;
};
