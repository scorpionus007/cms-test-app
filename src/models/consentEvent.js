const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentEvent = sequelize.define(
    'ConsentEvent',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      consent_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'consents', key: 'id' },
      },
      event_type: {
        type: DataTypes.ENUM('GRANTED', 'WITHDRAWN'),
        allowNull: false,
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'policy_versions', key: 'id' },
      },
      actor_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      previous_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'Hash of previous event in chain (null for first event)',
      },
      event_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'SHA256 chain hash for tamper evidence',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'DB-generated for chronological order in event sourcing',
      },
    },
    {
      tableName: 'consent_events',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['consent_id'] },
        { name: 'idx_event_lookup', fields: ['consent_id', 'created_at'] },
        { name: 'idx_event_type', fields: ['event_type'] },
      ],
    }
  );
  return ConsentEvent;
};
