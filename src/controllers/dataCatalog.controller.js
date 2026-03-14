const dataCatalogService = require('../services/dataCatalog.service');

async function list(req, res, next) {
  try {
    const entries = await dataCatalogService.listDataCatalog();
    res.status(200).json({ data_catalog: entries });
  } catch (err) {
    next(err);
  }
}

async function getByDataId(req, res, next) {
  try {
    const entry = await dataCatalogService.getByDataId(req.params.dataId);
    if (!entry) {
      const err = new Error('Data catalog entry not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getByDataId,
};
