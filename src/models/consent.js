const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Consent = sequelize.define(
    'Consent',
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
      user_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Pseudonymized user identifier (HMAC)',
      },
      purpose_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'purposes', key: 'id' },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'consents',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['tenant_id'] },
        { unique: true, fields: ['tenant_id', 'user_id', 'purpose_id'] },
        { name: 'idx_consent_lookup', fields: ['tenant_id', 'user_id'] },
      ],
    }
  );
  return Consent;
};
