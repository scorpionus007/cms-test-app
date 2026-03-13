const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Accept camelCase (userId, purposeId, policyVersionId) or snake_case (user_id, purpose_id, policy_version_id)
const grantConsentValidation = [
  body('userId').optional().trim(),
  body('user_id').optional().trim(),
  body('purposeId').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('purpose_id').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('policyVersionId').optional().trim().matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
  body('policy_version_id').optional().trim().matches(UUID_REGEX).withMessage('policy_version_id must be a valid UUID'),
  body().custom((value) => {
    const userId = value.userId ?? value.user_id;
    const purposeId = value.purposeId ?? value.purpose_id;
    const policyVersionId = value.policyVersionId ?? value.policy_version_id;
    if (!userId || typeof userId !== 'string' || !userId.trim()) throw new Error('user_id is required');
    if (!purposeId || !purposeId.trim()) throw new Error('purpose_id is required');
    if (!UUID_REGEX.test(purposeId)) throw new Error('purpose_id must be a valid UUID');
    if (!policyVersionId || !policyVersionId.trim()) throw new Error('policy_version_id is required');
    if (!UUID_REGEX.test(policyVersionId)) throw new Error('policy_version_id must be a valid UUID');
    return true;
  }),
];

const withdrawConsentValidation = [
  body('userId').optional().trim(),
  body('user_id').optional().trim(),
  body('purposeId').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body('purpose_id').optional().trim().matches(UUID_REGEX).withMessage('purpose_id must be a valid UUID'),
  body().custom((value) => {
    const userId = value.userId ?? value.user_id;
    const purposeId = value.purposeId ?? value.purpose_id;
    if (!userId || typeof userId !== 'string' || !userId.trim()) throw new Error('user_id is required');
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
