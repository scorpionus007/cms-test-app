const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Purpose = sequelize.define(
    'Purpose',
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
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      required_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of data_id from data_catalog',
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'e.g. { allowed_access: [], allowed_frequency: [] }',
      },
      validity_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Consent validity days; must be <= MIN(data_catalog.max_validity_days) for required_data',
      },
      retention_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'purposes',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['tenant_id'] },
        { unique: true, fields: ['tenant_id', 'name'] },
      ],
    }
  );
  return Purpose;
};
