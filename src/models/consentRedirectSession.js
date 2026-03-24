const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsentRedirectSession = sequelize.define(
    'ConsentRedirectSession',
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
      app_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'apps', key: 'id' },
      },
      purpose_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      redirect_token: {
        type: DataTypes.STRING(72),
        allowNull: false,
      },
      otp_hash: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      otp_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      otp_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      otp_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('pending', 'otp_sent', 'consented', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      consent_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
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
      tableName: 'consent_redirect_sessions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['redirect_token'] },
        { fields: ['tenant_id', 'app_id'] },
        { fields: ['status'] },
        { fields: ['expires_at'] },
      ],
    }
  );

  return ConsentRedirectSession;
};
