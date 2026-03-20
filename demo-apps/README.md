## Demo apps

Two small apps to help you test:

1. **Consent Demo** (`demo-apps/consent-demo`)
   - React UI + Node proxy (keeps `x-api-key` on the server)
   - Tests: `GET /public/purposes`, `GET /public/apps/:appId/policy`, `POST/DELETE /public/apps/:appId/consent`

2. **ERP Simulator** (`demo-apps/erp-sim`)
   - Node webhook receiver + React UI viewer
   - Optional endpoint to register a webhook in CMS using an admin bearer token

### Consent Demo

1. Configure env

Copy `demo-apps/consent-demo/.env.example` to `.env` and fill:
- `CMS_BASE_URL` (your CMS backend, e.g. `http://localhost:3000`)
- `CMS_PUBLIC_API_KEY` (tenant public API key)
- `CMS_APP_ID` (app UUID)

2. Run

In two terminals:

```bash
cd "demo-apps/consent-demo"
npm run dev
```

```bash
cd "demo-apps/consent-demo/frontend"
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

### ERP Simulator

1. Configure env

Copy `demo-apps/erp-sim/.env.example` to `.env`.

Optional:
- `CMS_ADMIN_BEARER_TOKEN` (owner/admin JWT) so the ERP UI can register a webhook automatically.
- `ERP_WEBHOOK_SECRET` if you want signature verification.

2. Run

In two terminals:

```bash
cd "demo-apps/erp-sim"
npm run dev
```

```bash
cd "demo-apps/erp-sim/frontend"
npm run dev
```

Open the Vite URL (usually `http://localhost:5174`).

Webhook receiver URL is:
- `http://localhost:4200/webhooks/securedapp`

