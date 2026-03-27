const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApiKey = sequelize.define(
    'ApiKey',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'api_keys',
      underscored: true,
      timestamps: false,
      indexes: [
        { name: 'api_keys_key_unique', unique: true, fields: ['key'] },
        { name: 'api_keys_tenant_id_idx', fields: ['tenant_id'] },
      ],
    }
  );
  return ApiKey;
};
