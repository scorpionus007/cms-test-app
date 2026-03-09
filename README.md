# SecureDApp CMS

Multi-tenant consent management system (DPDP-oriented): Google login, onboarding, purposes, policy versions, consent event sourcing, audit logs, API keys, public consent API, and webhooks.

**Stack:** Node.js, Express, MySQL, Sequelize.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MySQL** 8.x (or 5.7)
- **Google Cloud Console** – OAuth 2.0 Client ID (Web application) for Google login

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/securedapp_cms.git
cd securedapp_cms
npm install
```

### 2. Environment variables

**Do not commit `.env`.** The repo includes `.env.example` only. Copy it and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID (Web application) |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 characters). Use e.g. `openssl rand -base64 32` |
| `DB_HOST` | Yes | MySQL host (e.g. `localhost`) |
| `DB_PORT` | No | Default `3306` |
| `DB_NAME` | No | Default `securedapp_cms` |
| `DB_USER` | Yes | MySQL user |
| `DB_PASSWORD` | Yes | MySQL password |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `PORT` | No | Server port, default `3000` |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Comma-separated origins (production) |
| `DB_LOGGING` | No | Set to `true` to log SQL (dev only) |

### 3. Database

Create the MySQL database (if it doesn’t exist):

```bash
npm run db:create
```

Sync tables and apply migrations:

```bash
npm run db:sync
```

### 4. Run

```bash
npm start
# or with file watch
npm run dev
```

Server runs at **http://localhost:3000** (or your `PORT`). Swagger UI: **http://localhost:3000/api-docs**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server |
| `npm run dev` | Start with `--watch` |
| `npm run db:create` | Create MySQL database from `DB_*` |
| `npm run db:sync` | Sync/alter tables (Sequelize) |
| `npm run db:clear` | Truncate all data (dev only; requires `CLEAR_DB_CONFIRM=yes`) |
| `npm run db:fix-clients-name` | Add `clients.name` column if missing |

---

## API overview

- **Auth:** Google login → JWT (onboarding or full). Use `Authorization: Bearer <token>` for protected routes.
- **Tenant:** Onboard (`POST /tenant/onboard`), get current tenant (`GET /tenant/me`), API keys (`/tenant/api-keys`).
- **Consent:** Grant/withdraw and read state (JWT or public API with API key).
- **Purposes, policy versions, audit logs, webhooks:** See Swagger at `/api-docs` or `docs/API_AND_ARCHITECTURE.md`.

**Public API (API key):** `x-api-key` header; base path `/public` (consent grant/withdraw, purposes, policy, verify).

---

## Security

- Never commit `.env` or any file containing secrets.
- Use strong `JWT_SECRET` and keep it server-side only.
- In production, set `NODE_ENV=production` and configure `CORS_ORIGIN` and HTTPS.

---

## License

Private / use as per your organization’s terms.
