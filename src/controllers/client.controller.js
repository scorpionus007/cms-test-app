const clientService = require('../services/client.service');
const getClientIp = require('../utils/getClientIp');

async function invite(req, res, next) {
  try {
    const client = await clientService.inviteClient(
      req.user.tenant_id,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const clients = await clientService.listClients(req.user.tenant_id);
    res.status(200).json({ clients });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  invite,
  list,
};
