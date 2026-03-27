const crypto = require('crypto');
const { ConsentRedirectSession, Tenant } = require('../models');
const publicConsentService = require('./publicConsent.service');
const emailService = require('./email.service');

const SESSION_TTL_MINUTES = Number(process.env.REDIRECT_CONSENT_TTL_MINUTES || 30);
const OTP_TTL_MINUTES = Number(process.env.REDIRECT_CONSENT_OTP_TTL_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.REDIRECT_CONSENT_OTP_MAX_ATTEMPTS || 5);

function hashOtp(token, otp) {
  return crypto.createHash('sha256').update(`${token}:${otp}`).digest('hex');
}

function buildRedirectUrl(req, token) {
  const configuredBase = process.env.REDIRECT_CONSENT_BASE_URL;
  if (configuredBase && configuredBase.trim()) {
    return `${configuredBase.replace(/\/+$/, '')}/public/consent/redirect/${token}`;
  }
  // Avoid relying on req.protocol in environments with non-standard trust proxy setup.
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string' && forwardedProto.trim()
    ? forwardedProto.split(',')[0].trim()
    : 'http';
  const host = (typeof req?.get === 'function' ? req.get('host') : null) || req?.headers?.host || 'localhost:3000';
  return `${proto}://${host}/public/consent/redirect/${token}`;
}

function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createRedirectConsentRequest(req, tenantId, appId, body) {
  const email = String(body.email || '').trim();
  const phoneNumber = String(body.phone_number ?? body.phoneNumber ?? body.phone ?? '').trim();
  const purposeId = body.purposeId ?? body.purpose_id;
  const policyVersionId = body.policyVersionId ?? body.policy_version_id;

  const tenant = await Tenant.findByPk(tenantId, { attributes: ['id', 'consent_flow'] });
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    throw err;
  }
  if (tenant.consent_flow !== 'redirect') {
    const err = new Error('Tenant consent flow is not redirect');
    err.statusCode = 400;
    throw err;
  }

  const redirectToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
  const row = await ConsentRedirectSession.create({
    tenant_id: tenantId,
    app_id: appId,
    purpose_id: purposeId,
    policy_version_id: policyVersionId,
    email,
    phone_number: phoneNumber,
    redirect_token: redirectToken,
    expires_at: expiresAt,
    status: 'pending',
  });

  return {
    request_id: row.id,
    redirect_url: buildRedirectUrl(req, redirectToken),
    expires_at: expiresAt.toISOString(),
  };
}

async function getRedirectSessionByToken(token) {
  const row = await ConsentRedirectSession.findOne({ where: { redirect_token: token } });
  if (!row) {
    const err = new Error('Redirect consent request not found');
    err.statusCode = 404;
    throw err;
  }
  if (row.status === 'consented') {
    return row;
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    await row.update({ status: 'expired' });
    const err = new Error('Redirect consent request expired');
    err.statusCode = 410;
    throw err;
  }
  return row;
}

async function sendOtp(token) {
  const row = await getRedirectSessionByToken(token);
  if (row.status === 'consented') {
    const err = new Error('Consent is already completed');
    err.statusCode = 409;
    throw err;
  }

  const otp = createOtpCode();
  const now = new Date();
  const otpExpiry = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
  await row.update({
    otp_hash: hashOtp(token, otp),
    otp_sent_at: now,
    otp_expires_at: otpExpiry,
    otp_attempts: 0,
    status: 'otp_sent',
  });

  const mailResult = await emailService.sendOtpEmail(row.email, otp);
  const response = {
    success: true,
    message: mailResult.sent ? 'OTP sent' : 'OTP generated (SMTP not configured)',
  };
  if (!mailResult.sent && process.env.NODE_ENV !== 'production') {
    response.dev_otp = otp;
  }
  return response;
}

async function verifyOtpAndGrantConsent(token, otp, ipAddress = null) {
  const row = await getRedirectSessionByToken(token);
  if (row.status === 'consented') {
    return { success: true, already_consented: true, consent_id: row.consent_id };
  }
  if (!row.otp_hash || !row.otp_expires_at) {
    const err = new Error('OTP not sent yet');
    err.statusCode = 400;
    throw err;
  }
  if (new Date(row.otp_expires_at).getTime() < Date.now()) {
    const err = new Error('OTP expired');
    err.statusCode = 400;
    throw err;
  }
  if ((row.otp_attempts || 0) >= OTP_MAX_ATTEMPTS) {
    const err = new Error('Maximum OTP attempts exceeded');
    err.statusCode = 429;
    throw err;
  }

  const incomingHash = hashOtp(token, otp);
  if (incomingHash !== row.otp_hash) {
    await row.update({ otp_attempts: (row.otp_attempts || 0) + 1 });
    const err = new Error('Invalid OTP');
    err.statusCode = 400;
    throw err;
  }

  const result = await publicConsentService.grantConsent(
    row.tenant_id,
    row.app_id,
    {
      email: row.email,
      phone_number: row.phone_number,
      purpose_id: row.purpose_id,
      policy_version_id: row.policy_version_id,
    },
    ipAddress
  );

  await row.update({
    status: 'consented',
    consent_id: result.consentId || null,
    completed_at: new Date(),
  });

  return { success: true, consent_id: result.consentId || null };
}

module.exports = {
  createRedirectConsentRequest,
  sendOtp,
  verifyOtpAndGrantConsent,
};
