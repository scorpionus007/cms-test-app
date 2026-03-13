const { body, param, query } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const submitValidation = [
  body('app_id').trim().notEmpty().withMessage('app_id is required').matches(UUID_REGEX).withMessage('app_id must be a valid UUID'),
  body('user_id').trim().notEmpty().withMessage('user_id is required'),
  body('type')
    .optional()
    .isIn(['access', 'erasure', 'rectification'])
    .withMessage('type must be access, erasure, or rectification'),
  body('request_type')
    .optional()
    .isIn(['access', 'erasure', 'rectification'])
    .withMessage('request_type must be access, erasure, or rectification'),
  body()
    .custom((val) => {
      if (!val.type && !val.request_type) throw new Error('type or request_type is required');
      return true;
    }),
];

const updateStatusValidation = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('status is required')
    .isIn(['pending', 'processing', 'completed', 'rejected'])
    .withMessage('status must be pending, processing, completed, or rejected'),
  body('metadata').optional().isObject().withMessage('metadata must be an object'),
];

const idParamValidation = [param('id').matches(UUID_REGEX).withMessage('id must be a valid UUID')];

const listQueryValidation = [
  query('status').optional().isIn(['pending', 'processing', 'completed', 'rejected']),
  query('request_type').optional().isIn(['access', 'erasure', 'rectification']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  submitValidation,
  updateStatusValidation,
  idParamValidation,
  listQueryValidation,
};
