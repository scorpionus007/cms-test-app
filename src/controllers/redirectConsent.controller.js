const redirectConsentService = require('../services/redirectConsent.service');
const getClientIp = require('../utils/getClientIp');

function renderRedirectConsentPage(token) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Consent Verification</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; max-width: 520px; }
    input, button { font-size: 14px; padding: 8px; margin-top: 8px; }
    input { width: 180px; }
    .msg { margin-top: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h2>Verify OTP to provide consent</h2>
  <p>Click "Send OTP", then enter the code you received.</p>
  <button id="sendBtn" type="button">Send OTP</button>
  <div>
    <input id="otp" placeholder="Enter 6-digit OTP" maxlength="6" />
  </div>
  <button id="verifyBtn" type="button">Verify OTP & Consent</button>
  <div id="msg" class="msg"></div>

  <script>
    const token = ${JSON.stringify(token)};
    const msg = document.getElementById('msg');
    const sendBtn = document.getElementById('sendBtn');
    const verifyBtn = document.getElementById('verifyBtn');

    function setMsg(text) { msg.textContent = text; }

    sendBtn.onclick = async () => {
      setMsg('Sending OTP...');
      try {
        const res = await fetch('/public/consent/redirect/' + encodeURIComponent(token) + '/send-otp', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        setMsg(data.dev_otp ? ('OTP sent. Dev OTP: ' + data.dev_otp) : 'OTP sent successfully');
      } catch (e) {
        setMsg(e.message);
      }
    };

    verifyBtn.onclick = async () => {
      const otp = (document.getElementById('otp').value || '').trim();
      setMsg('Verifying OTP...');
      try {
        const res = await fetch('/public/consent/redirect/' + encodeURIComponent(token) + '/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
        setMsg('Consent granted successfully');
      } catch (e) {
        setMsg(e.message);
      }
    };
  </script>
</body>
</html>`;
}

async function createRequest(req, res, next) {
  try {
    const appId = req.appId || req.params.appId;
    const payload = await redirectConsentService.createRedirectConsentRequest(req, req.tenant.id, appId, req.body);
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
}

async function getHostedPage(req, res, next) {
  try {
    res.type('html').send(renderRedirectConsentPage(req.params.token));
  } catch (err) {
    next(err);
  }
}

async function sendOtp(req, res, next) {
  try {
    const payload = await redirectConsentService.sendOtp(req.params.token);
    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const payload = await redirectConsentService.verifyOtpAndGrantConsent(req.params.token, req.body.otp, getClientIp(req));
    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRequest,
  getHostedPage,
  sendOtp,
  verifyOtp,
};
