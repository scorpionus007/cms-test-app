const purposeService = require('../services/purpose.service');
const getClientIp = require('../utils/getClientIp');

async function create(req, res, next) {
  try {
    const purpose = await purposeService.createPurpose(
      req.user.tenant_id,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(201).json({ purpose });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const includeInactive = req.query.include_inactive === 'true' || req.query.include_inactive === '1';
    const purposes = await purposeService.listPurposes(
      req.user.tenant_id,
      req.user.client_id,
      getClientIp(req),
      { includeInactive }
    );
    res.status(200).json({ purposes });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const purpose = await purposeService.updatePurpose(
      req.user.tenant_id,
      req.params.id,
      req.user.client_id,
      req.body,
      getClientIp(req)
    );
    res.status(200).json({ purpose });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await purposeService.deletePurpose(
      req.user.tenant_id,
      req.params.id,
      req.user.client_id,
      getClientIp(req)
    );
    res.status(200).json({ message: 'Purpose deactivated (soft delete)' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
};
