const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL;
const fromName = process.env.SMTP_FROM_NAME || 'SecureDApp CMS';

let transporter = null;

function isSmtpConfigured() {
  return Boolean(smtpHost && smtpUser && smtpPass && fromEmail);
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  return transporter;
}

async function sendOtpEmail(to, otpCode) {
  const tx = getTransporter();
  if (!tx) {
    logger.warn('SMTP not configured; skipping OTP email send.');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  await tx.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: 'Your consent OTP code',
    text: `Your OTP for consent verification is ${otpCode}. It is valid for 10 minutes.`,
    html: `<p>Your OTP for consent verification is <b>${otpCode}</b>.</p><p>It is valid for 10 minutes.</p>`,
  });

  return { sent: true };
}

module.exports = {
  isSmtpConfigured,
  sendOtpEmail,
};
