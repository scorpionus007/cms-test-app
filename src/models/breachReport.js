const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BreachReport = sequelize.define(
    'BreachReport',
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
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      occurred_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reported_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'breach_reports',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_id'] }],
    }
  );
  return BreachReport;
};
