const { body, param } = require('express-validator');

const createValidation = [
  body('name')
    .optional()
    .trim()
    .isString()
    .withMessage('name must be a string')
    .isLength({ max: 255 })
    .withMessage('name must be at most 255 characters'),
];

const revokeParamValidation = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

module.exports = {
  createValidation,
  revokeParamValidation,
};
