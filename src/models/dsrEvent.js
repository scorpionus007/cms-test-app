const { DataTypes } = require('sequelize');

const DSR_EVENT_STATUS = ['pending', 'processing', 'completed'];

module.exports = (sequelize) => {
  const DsrEvent = sequelize.define(
    'DsrEvent',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      dsr_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'dsr_requests', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(...DSR_EVENT_STATUS),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'e.g. { processed_by, notes }',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'dsr_events',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['dsr_id'] }],
    }
  );
  return DsrEvent;
};
