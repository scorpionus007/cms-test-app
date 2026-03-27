const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;
let transporterCacheKey = null;

function getSmtpConfig() {
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  const fromEmail = (process.env.SMTP_FROM_EMAIL || smtpUser || '').trim();
  const fromName = process.env.SMTP_FROM_NAME || 'SecureDApp CMS';
  return { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromEmail, fromName };
}

function isSmtpConfigured() {
  const cfg = getSmtpConfig();
  return Boolean(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass && cfg.fromEmail);
}

function getTransporter() {
  const cfg = getSmtpConfig();
  if (!isSmtpConfigured()) return null;
  const cacheKey = `${cfg.smtpHost}|${cfg.smtpPort}|${cfg.smtpSecure}|${cfg.smtpUser}|${cfg.smtpPass}`;
  if (transporter && transporterCacheKey === cacheKey) return transporter;
  transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass,
    },
  });
  transporterCacheKey = cacheKey;
  return transporter;
}

async function sendOtpEmail(to, otpCode) {
  const cfg = getSmtpConfig();
  const tx = getTransporter();
  if (!tx) {
    logger.warn('SMTP not configured; skipping OTP email send.');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await tx.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject: 'Your consent OTP code',
      text: `Your OTP for consent verification is ${otpCode}. It is valid for 10 minutes.`,
      html: `<p>Your OTP for consent verification is <b>${otpCode}</b>.</p><p>It is valid for 10 minutes.</p>`,
    });
  } catch (err) {
    const code = err?.code || '';
    const responseCode = Number(err?.responseCode || 0);
    // Gmail auth failures (e.g., 535) should not crash redirect flow in development.
    if (code === 'EAUTH' || responseCode === 535) {
      logger.warn(`SMTP authentication failed (${responseCode || code}). Check EMAIL_USER/EMAIL_PASS or app password.`);
      return { sent: false, reason: 'smtp_auth_failed' };
    }
    throw err;
  }

  return { sent: true };
}

module.exports = {
  isSmtpConfigured,
  sendOtpEmail,
};
