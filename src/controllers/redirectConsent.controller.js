const redirectConsentService = require('../services/redirectConsent.service');
const getClientIp = require('../utils/getClientIp');

function renderRedirectConsentPage(token) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SecureDApp Consent Verification</title>
  <style>
    :root {
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-400: #94a3b8;
      --slate-600: #475569;
      --slate-900: #0f172a;
      --indigo-600: #4f46e5;
      --indigo-700: #4338ca;
      --emerald-50: #ecfdf5;
      --emerald-700: #047857;
      --red-50: #fef2f2;
      --red-700: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: var(--slate-50);
      color: var(--slate-900);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .wrap { width: 100%; max-width: 460px; }
    .brand {
      display: flex;
      justify-content: center;
      margin-bottom: 14px;
    }
    .logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--indigo-600);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      box-shadow: 0 10px 24px rgba(79, 70, 229, 0.25);
    }
    .title {
      margin: 0;
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 8px 0 0;
      text-align: center;
      color: var(--slate-600);
      font-size: 14px;
    }
    .card {
      margin-top: 22px;
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
    }
    .label {
      display: block;
      font-size: 11px;
      font-weight: 800;
      color: var(--slate-400);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }
    .input {
      width: 100%;
      height: 44px;
      padding: 0 14px;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      background: var(--slate-50);
      font-size: 14px;
      color: var(--slate-900);
      outline: none;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .input:focus {
      border-color: var(--indigo-600);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
      background: #fff;
    }
    .actions { display: grid; gap: 10px; margin-top: 14px; }
    .btn {
      height: 42px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform .08s ease, background-color .2s ease, opacity .2s ease;
    }
    .btn:active { transform: scale(0.99); }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-primary { background: var(--indigo-600); color: #fff; }
    .btn-primary:hover { background: var(--indigo-700); }
    .btn-secondary {
      background: #fff;
      color: var(--slate-600);
      border: 1px solid var(--slate-200);
    }
    .btn-secondary:hover { background: var(--slate-50); }
    .status {
      margin-top: 14px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
      border: 1px solid var(--slate-200);
      background: var(--slate-50);
      color: var(--slate-600);
    }
    .status.success { background: var(--emerald-50); color: var(--emerald-700); border-color: #a7f3d0; }
    .status.error { background: var(--red-50); color: var(--red-700); border-color: #fecaca; }
    .hint {
      margin-top: 14px;
      font-size: 12px;
      color: var(--slate-400);
      text-align: center;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <div class="brand"><div class="logo">SD</div></div>
    <h2 class="title">Consent Verification</h2>
    <p class="subtitle">Verify OTP to complete your consent securely.</p>

    <section class="card">
      <label for="otp" class="label">One-time password</label>
      <input id="otp" class="input" placeholder="Enter 6-digit OTP" maxlength="6" inputmode="numeric" />
      <div class="actions">
        <button id="sendBtn" class="btn btn-secondary" type="button">Send OTP</button>
        <button id="verifyBtn" class="btn btn-primary" type="button">Verify OTP & Grant Consent</button>
      </div>
      <div id="msg" class="status">Click "Send OTP", then enter the code you received.</div>
      <p class="hint">SecureDApp CMS - Redirect Consent Flow</p>
    </section>
  </main>

  <div id="busyOverlay" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.2);backdrop-filter:blur(1px);"></div>

  <script>
    const token = ${JSON.stringify(token)};
    const msg = document.getElementById('msg');
    const sendBtn = document.getElementById('sendBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otp');
    const busyOverlay = document.getElementById('busyOverlay');

    function setBusy(isBusy) {
      sendBtn.disabled = isBusy;
      verifyBtn.disabled = isBusy;
      otpInput.disabled = isBusy;
      busyOverlay.style.display = isBusy ? 'block' : 'none';
    }

    function setMsg(text, tone) {
      msg.textContent = text;
      msg.classList.remove('success', 'error');
      if (tone === 'success') msg.classList.add('success');
      if (tone === 'error') msg.classList.add('error');
    }

    sendBtn.onclick = async () => {
      setBusy(true);
      setMsg('Sending OTP...');
      try {
        const res = await fetch('/public/consent/redirect/' + encodeURIComponent(token) + '/send-otp', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        setMsg(
          data.dev_otp
            ? ('OTP sent. Dev OTP: ' + data.dev_otp)
            : 'OTP sent successfully to your registered email.',
          'success'
        );
      } catch (e) {
        setMsg(e.message || 'Failed to send OTP', 'error');
      } finally {
        setBusy(false);
      }
    };

    verifyBtn.onclick = async () => {
      const otp = (otpInput.value || '').trim();
      if (!/^\\d{6}$/.test(otp)) {
        setMsg('Please enter a valid 6-digit OTP.', 'error');
        return;
      }
      setBusy(true);
      setMsg('Verifying OTP...');
      try {
        const res = await fetch('/public/consent/redirect/' + encodeURIComponent(token) + '/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
        if (data.already_consented) {
          setMsg('Consent was already completed for this request.', 'success');
        } else {
          setMsg('Consent granted successfully.', 'success');
        }
      } catch (e) {
        setMsg(e.message || 'Failed to verify OTP', 'error');
      } finally {
        setBusy(false);
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
