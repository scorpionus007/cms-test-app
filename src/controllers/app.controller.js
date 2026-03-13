const appService = require('../services/app.service');
const getClientIp = require('../utils/getClientIp');

async function create(req, res, next) {
  try {
    const app = await appService.createApp(
      req.user.tenant_id,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(201).json({ app });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const apps = await appService.listApps(req.user.tenant_id);
    res.status(200).json({ apps });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const app = await appService.getAppById(req.user.tenant_id, req.params.appId);
    res.status(200).json(app);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const app = await appService.updateApp(
      req.user.tenant_id,
      req.params.appId,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(200).json({ app });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await appService.deleteApp(
      req.user.tenant_id,
      req.params.appId,
      req.user.client_id,
      getClientIp(req)
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
