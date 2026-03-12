const { DataTypes } = require('sequelize');

const DSR_REQUEST_TYPE = ['access', 'erasure', 'rectification'];
const DSR_STATUS = ['pending', 'processing', 'completed', 'rejected'];

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
        type: DataTypes.ENUM(...DSR_REQUEST_TYPE),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...DSR_STATUS),
        allowNull: false,
        defaultValue: 'pending',
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
        { fields: ['tenant_id', 'user_id'] },
      ],
    }
  );
  DsrRequest.DSR_REQUEST_TYPE = DSR_REQUEST_TYPE;
  DsrRequest.DSR_STATUS = DSR_STATUS;
  return DsrRequest;
};
