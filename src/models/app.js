const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const App = sequelize.define(
    'App',
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
        comment: 'Display name of the app',
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'URL-friendly identifier, unique per tenant',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: true,
        defaultValue: 'active',
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
      tableName: 'apps',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['tenant_id'] },
        { unique: true, fields: ['tenant_id', 'slug'] },
      ],
    }
  );
  return App;
};
