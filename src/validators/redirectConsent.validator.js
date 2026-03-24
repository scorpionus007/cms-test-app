const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createRedirectConsentRequestValidation = [
  body('email').trim().notEmpty().withMessage('email is required'),
  body('phone_number').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('phone').optional().trim(),
  body('purposeId').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('purpose_id').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('policyVersionId').optional().trim().matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
  body('policy_version_id').optional().trim().matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
  body().custom((value) => {
    const phone = value.phone_number ?? value.phoneNumber ?? value.phone;
    const purposeId = value.purposeId ?? value.purpose_id;
    const policyVersionId = value.policyVersionId ?? value.policy_version_id;
    if (!phone || typeof phone !== 'string' || !phone.trim()) throw new Error('phone_number is required');
    if (!purposeId || !purposeId.trim()) throw new Error('purpose_id is required');
    if (!UUID_REGEX.test(purposeId)) throw new Error('purpose_id must be a valid UUID');
    if (!policyVersionId || !policyVersionId.trim()) throw new Error('policy_version_id is required');
    if (!UUID_REGEX.test(policyVersionId)) throw new Error('policy_version_id must be a valid UUID');
    return true;
  }),
];

const redirectTokenParamValidation = [
  param('token').trim().notEmpty().withMessage('token is required').isLength({ min: 16, max: 100 }).withMessage('token is invalid'),
];

const verifyRedirectOtpValidation = [
  body('otp').trim().notEmpty().withMessage('otp is required').matches(/^\d{6}$/).withMessage('otp must be a 6 digit numeric code'),
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
  createRedirectConsentRequestValidation,
  redirectTokenParamValidation,
  verifyRedirectOtpValidation,
  handleValidationErrors,
};
