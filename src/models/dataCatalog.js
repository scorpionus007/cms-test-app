const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DataCatalog = sequelize.define(
    'DataCatalog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      data_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Stable platform-wide identifier e.g. AADHAAR_NUMBER',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g. identity, address',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sensitivity: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        allowNull: true,
      },
      max_validity_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Max consent validity days for this data type (DPDP); purpose validity_days cannot exceed this',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
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
      tableName: 'data_catalog',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'data_catalog_data_id_unique', unique: true, fields: ['data_id'] },
        { name: 'data_catalog_status_idx', fields: ['status'] },
      ],
    }
  );
  return DataCatalog;
};
