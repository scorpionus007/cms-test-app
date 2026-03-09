const { body, param } = require('express-validator');

const ALLOWED = ['consent.granted', 'consent.withdrawn', 'policy.updated', 'purpose.created'];

const createValidation = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('url is required')
    .isURL({ require_tld: false, protocols: ['http', 'https'] })
    .withMessage('url must be a valid http(s) URL'),
  body('events')
    .isArray({ min: 1 })
    .withMessage('events must be a non-empty array')
    .custom((val) => {
      const invalid = val.filter((e) => typeof e !== 'string' || !ALLOWED.includes(e.trim()));
      if (invalid.length) {
        throw new Error('events may only contain: ' + ALLOWED.join(', '));
      }
      return true;
    }),
  body('secret').optional().trim().isString(),
];

const deleteParamValidation = [param('id').isUUID().withMessage('id must be a valid UUID')];

module.exports = {
  createValidation,
  deleteParamValidation,
};
