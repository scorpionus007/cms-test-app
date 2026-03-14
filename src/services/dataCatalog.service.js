const { DataCatalog } = require('../models');

/**
 * List active data catalog entries (platform-wide, read-only).
 */
async function listDataCatalog() {
  const rows = await DataCatalog.findAll({
    where: { status: 'active' },
    attributes: ['id', 'data_id', 'category', 'description', 'sensitivity', 'max_validity_days', 'status', 'created_at', 'updated_at'],
    order: [['data_id', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
}

/**
 * Get a single catalog entry by data_id (for optional GET /data-catalog/:dataId).
 */
async function getByDataId(dataId) {
  const row = await DataCatalog.findOne({
    where: { data_id: dataId, status: 'active' },
    attributes: ['id', 'data_id', 'category', 'description', 'sensitivity', 'max_validity_days', 'status', 'created_at', 'updated_at'],
  });
  return row ? row.toJSON() : null;
}

module.exports = {
  listDataCatalog,
  getByDataId,
};
