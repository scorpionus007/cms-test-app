const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentStateCache = sequelize.define(
    'ConsentStateCache',
    {
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'tenants', key: 'id' },
      },
      user_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true,
        comment: 'Pseudonymous user identifier',
      },
      purpose_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'purposes', key: 'id' },
      },
      current_status: {
        type: DataTypes.ENUM('granted', 'withdrawn'),
        allowNull: false,
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'policy_versions', key: 'id' },
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'consent_state_cache',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_id', 'user_id'] }],
    }
  );
  return ConsentStateCache;
};
