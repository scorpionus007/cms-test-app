const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Webhook = sequelize.define(
    'Webhook',
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
      url: {
        type: DataTypes.STRING(2048),
        allowNull: false,
      },
      secret: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'HMAC secret for signing payloads',
      },
      events: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of event names to subscribe',
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
      tableName: 'webhooks',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_id'] }],
    }
  );
  return Webhook;
};
