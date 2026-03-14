const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createPurposeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string'),
  body('description').optional().trim().isString().withMessage('description must be a string'),
  body('required').optional().isBoolean().withMessage('required must be a boolean'),
  body('required_data').optional().isArray().withMessage('required_data must be an array'),
  body('required_data.*').optional().isString().withMessage('required_data items must be strings'),
  body('validity_days').optional().isInt({ min: 0 }).withMessage('validity_days must be a non-negative integer'),
  body('permissions').optional().isObject().withMessage('permissions must be an object'),
];

const updatePurposeValidation = [
  param('id').trim().notEmpty().withMessage('id is required').matches(UUID_REGEX).withMessage('id must be a valid UUID'),
  body('name').optional().trim().isString().withMessage('name must be a string'),
  body('description').optional().trim().isString().withMessage('description must be a string'),
  body('required').optional().isBoolean().withMessage('required must be a boolean'),
  body('active').optional().isBoolean().withMessage('active must be a boolean'),
  body('required_data').optional().isArray().withMessage('required_data must be an array'),
  body('required_data.*').optional().isString().withMessage('required_data items must be strings'),
  body('validity_days').optional().isInt({ min: 0 }).withMessage('validity_days must be a non-negative integer'),
  body('permissions').optional().isObject().withMessage('permissions must be an object'),
];

const purposeIdParamValidation = [
  param('id').trim().notEmpty().withMessage('id is required').matches(UUID_REGEX).withMessage('id must be a valid UUID'),
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
  createPurposeValidation,
  updatePurposeValidation,
  purposeIdParamValidation,
  handleValidationErrors,
};
