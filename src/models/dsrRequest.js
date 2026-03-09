const { DataTypes } = require('sequelize');

const DSR_STATUS = ['created', 'identity_verified', 'approved', 'executing', 'completed', 'rejected', 'escalated'];
const DSR_TYPE = ['access', 'erasure', 'correction', 'portability'];

module.exports = (sequelize) => {
  const DsrRequest = sequelize.define(
    'DsrRequest',
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
        comment: 'Pseudonymized user identifier',
      },
      request_type: {
        type: DataTypes.ENUM(...DSR_TYPE),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...DSR_STATUS),
        allowNull: false,
        defaultValue: 'created',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'dsr_requests',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['tenant_id', 'status'] },
      ],
    }
  );
  return DsrRequest;
};
