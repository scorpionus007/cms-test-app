const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createAppValidation = [
  body('name').trim().notEmpty().withMessage('name is required').isString().withMessage('name must be a string'),
  body('slug')
    .trim()
    .notEmpty()
    .withMessage('slug is required')
    .isString()
    .withMessage('slug must be a string')
    .matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i)
    .withMessage('slug must be lowercase alphanumeric and hyphens only'),
];

const updateAppValidation = [
  body('name').optional().trim().isString().withMessage('name must be a string'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i)
    .withMessage('slug must be lowercase alphanumeric and hyphens only'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('status must be active or inactive'),
];

const appIdParamValidation = [
  param('appId').trim().notEmpty().withMessage('appId is required').matches(UUID_REGEX).withMessage('appId must be a valid UUID'),
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
  createAppValidation,
  updateAppValidation,
  appIdParamValidation,
  handleValidationErrors,
};
