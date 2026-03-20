const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Public consent requires both email and phone_number; purpose/policy may be camelCase or snake_case.
const grantConsentValidation = [
  body('email').optional().trim(),
  body('userEmail').optional().trim(),
  body('user_email').optional().trim(),
  body('phone_number').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('phone').optional().trim(),
  body('purposeId').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('purpose_id').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('policyVersionId').optional().trim().matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
  body('policy_version_id').optional().trim().matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
  body().custom((value) => {
    const email = value.email ?? value.userEmail ?? value.user_email;
    const phone = value.phone_number ?? value.phoneNumber ?? value.phone;
    const purposeId = value.purposeId ?? value.purpose_id;
    const policyVersionId = value.policyVersionId ?? value.policy_version_id;
    if (!email || typeof email !== 'string' || !email.trim()) throw new Error('email is required');
    if (!phone || typeof phone !== 'string' || !phone.trim()) throw new Error('phone_number is required');
    if (!purposeId || !purposeId.trim()) throw new Error('purpose_id is required');
    if (!UUID_REGEX.test(purposeId)) throw new Error('purpose_id must be a valid UUID');
    if (!policyVersionId || !policyVersionId.trim()) throw new Error('policy_version_id is required');
    if (!UUID_REGEX.test(policyVersionId)) throw new Error('policy_version_id must be a valid UUID');
    return true;
  }),
];

const withdrawConsentValidation = [
  body('email').optional().trim(),
  body('userEmail').optional().trim(),
  body('user_email').optional().trim(),
  body('phone_number').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('phone').optional().trim(),
  body('purposeId').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('purpose_id').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body().custom((value) => {
    const email = value.email ?? value.userEmail ?? value.user_email;
    const phone = value.phone_number ?? value.phoneNumber ?? value.phone;
    const purposeId = value.purposeId ?? value.purpose_id;
    if (!email || typeof email !== 'string' || !email.trim()) throw new Error('email is required');
    if (!phone || typeof phone !== 'string' || !phone.trim()) throw new Error('phone_number is required');
    if (!purposeId || !purposeId.trim()) throw new Error('purpose_id is required');
    if (!UUID_REGEX.test(purposeId)) throw new Error('purpose_id must be a valid UUID');
    return true;
  }),
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
