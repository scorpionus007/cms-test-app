const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const createPolicyVersionValidation = [
  body('version')
    .trim()
    .notEmpty()
    .withMessage('version is required')
    .isString()
    .withMessage('version must be a string'),
  body('policy_text')
    .notEmpty()
    .withMessage('policy_text is required')
    .isString()
    .withMessage('policy_text must be a string'),
  body('effective_from')
    .optional()
    .isISO8601()
    .withMessage('effective_from must be a valid ISO-8601 date'),
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
  createPolicyVersionValidation,
  handleValidationErrors,
};
