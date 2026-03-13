const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Client = sequelize.define(
    "Client",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },

      provider: {
        type: DataTypes.ENUM("google", "email"),
        allowNull: false,
        defaultValue: "google",
      },

      role: {
        type: DataTypes.ENUM(
          "owner",
          "admin",
          "compliance_manager",
          "auditor",
          "viewer"
        ),
        allowNull: false,
        defaultValue: "admin",
      },

      status: {
        type: DataTypes.ENUM("active", "inactive", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },

      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "clients",
      underscored: true,
      timestamps: false,

      indexes: [
        {
          unique: true,
          fields: ["tenant_id", "email"], // same email allowed in different tenants
        },
        {
          fields: ["tenant_id"],
        },
        {
          fields: ["role"],
        },
      ],
    }
  );

  return Client;
};