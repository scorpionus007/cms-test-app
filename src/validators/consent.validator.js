const { body, param } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const grantConsentValidation = [
  body('email').trim().notEmpty().withMessage('email is required').isString().withMessage('email must be a string'),
  body('phone_number')
    .optional()
    .trim()
    .isString()
    .withMessage('phone_number must be a string'),
  body('phoneNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('phoneNumber must be a string'),
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
  body().custom((value) => {
    const phone = value.phone_number ?? value.phoneNumber;
    if (!phone || typeof phone !== 'string' || !phone.trim()) throw new Error('phone_number is required');
    return true;
  }),
];

const withdrawConsentBodyValidation = [
  body('email').trim().notEmpty().withMessage('email is required').isString().withMessage('email must be a string'),
  body('phone_number')
    .optional()
    .trim()
    .isString()
    .withMessage('phone_number must be a string'),
  body('phoneNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('phoneNumber must be a string'),
  body('purposeId')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('purposeId must be a valid UUID'),
  body('purpose_id')
    .optional()
    .trim()
    .matches(UUID_REGEX)
    .withMessage('purpose_id must be a valid UUID'),
  body().custom((value) => {
    const phone = value.phone_number ?? value.phoneNumber;
    const purposeId = value.purposeId ?? value.purpose_id;
    if (!phone || typeof phone !== 'string' || !phone.trim()) throw new Error('phone_number is required');
    if (!purposeId || !purposeId.trim()) throw new Error('purposeId is required');
    if (!UUID_REGEX.test(purposeId)) throw new Error('purposeId must be a valid UUID');
    return true;
  }),
];

const withdrawConsentParamValidation = [
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
  withdrawConsentBodyValidation,
  withdrawConsentParamValidation,
  getConsentParamValidation,
  handleValidationErrors,
};
