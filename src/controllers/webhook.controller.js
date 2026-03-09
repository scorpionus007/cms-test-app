const webhookService = require('../services/webhook.service');

async function create(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const result = await webhookService.createWebhook(tenantId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const webhooks = await webhookService.listWebhooks(tenantId);
    res.status(200).json({ webhooks });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const tenantId = req.user.tenant_id;
    const webhookId = req.params.id;
    await webhookService.deleteWebhook(tenantId, webhookId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  remove,
};
