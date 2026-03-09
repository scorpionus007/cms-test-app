const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const grantConsentValidation = [
  body('user_id').trim().notEmpty().withMessage('user_id is required').isString().withMessage('user_id must be a string'),
  body('purpose_id').trim().notEmpty().withMessage('purpose_id is required').matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('policy_version_id').trim().notEmpty().withMessage('policy_version_id is required').matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
];

const withdrawConsentValidation = [
  body('user_id').trim().notEmpty().withMessage('user_id is required').isString().withMessage('user_id must be a string'),
  body('purpose_id').trim().notEmpty().withMessage('purpose_id is required').matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array().map((e) => e.msg).join('; '));
    err.statusCode = 400;
    err.validationErrors = errors.array();
    return next(err);
  }
  next();
}

module.exports = {
  grantConsentValidation,
  withdrawConsentValidation,
  handleValidationErrors,
};
