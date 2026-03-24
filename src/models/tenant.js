const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Organization name',
      },
      domain: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      consent_flow: {
        type: DataTypes.ENUM('embedded', 'redirect'),
        allowNull: false,
        defaultValue: 'embedded',
      },
      dpdp_applicable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'inactive'),
        allowNull: true,
        defaultValue: 'active',
      },
      trust_level: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Client (owner) id who created the tenant; no FK to avoid creation order dependency',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'tenants',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['domain'] }],
    }
  );
  return Tenant;
};
