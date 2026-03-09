const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WebhookDelivery = sequelize.define(
    'WebhookDelivery',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      webhook_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'webhooks', key: 'id' },
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('success', 'failed'),
        allowNull: false,
      },
      response_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      retries: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'webhook_deliveries',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['webhook_id'] }, { fields: ['created_at'] }],
    }
  );
  return WebhookDelivery;
};
