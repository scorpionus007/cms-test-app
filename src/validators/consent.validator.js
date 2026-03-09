const { body, param } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const grantConsentValidation = [
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('userId is required')
    .isString()
    .withMessage('userId must be a string'),
  body('purposeId')
    .trim()
    .notEmpty()
    .withMessage('purposeId is required')
    .matches(UUID_REGEX)
    .withMessage('purposeId must be a valid UUID'),
  body('policyVersionId')
    .trim()
    .notEmpty()
    .withMessage('policyVersionId is required')
    .matches(UUID_REGEX)
    .withMessage('policyVersionId must be a valid UUID'),
];

const withdrawConsentParamValidation = [
  param('userId')
    .trim()
    .notEmpty()
    .withMessage('userId is required'),
  param('purposeId')
    .trim()
    .notEmpty()
    .withMessage('purposeId is required')
    .matches(UUID_REGEX)
    .withMessage('purposeId must be a valid UUID'),
];

const getConsentParamValidation = [
  param('userId')
    .trim()
    .notEmpty()
    .withMessage('userId is required'),
];

function handleValidationErrors(req, res, next) {
  const { validationResult } = require('express-validator');
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
  withdrawConsentParamValidation,
  getConsentParamValidation,
  handleValidationErrors,
};
