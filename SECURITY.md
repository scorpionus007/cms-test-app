# Security (OWASP Top 10 & Hardening)

## OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| **A01 Broken Access Control** | JWT with `tenant_id` and scopes; all tenant data scoped by `tenant_id`; no cross-tenant access. |
| **A02 Cryptographic Failures** | JWT signed with strong secret (env); HTTPS in production (use reverse proxy); no sensitive data in logs. |
| **A03 Injection** | Sequelize ORM only (parameterized queries); express-validator for input validation/sanitization; no raw SQL with user input. |
| **A04 Insecure Design** | Tenant isolation by design; rate limiting; body size limit; audit trail. |
| **A05 Security Misconfiguration** | Helmet (secure headers); CORS allowlist; generic 500 messages in production; no stack traces to client. |
| **A06 Vulnerable Components** | Keep dependencies updated (`npm audit`); pin versions in package.json. |
| **A07 Identification & Auth Failures** | Google ID token verification; strict rate limit on `/auth/google-login`; audit log for logins/onboarding. |
| **A08 Software/Data Integrity** | JWT signature verification; input validation; chained audit log hashes. |
| **A09 Logging & Monitoring** | Audit log (tenant, entity, action, actor, hash); onboarding events logged. |
| **A10 SSRF** | N/A for current auth scope; when adding webhooks, validate and allowlist URLs. |

## Rate Limiting

- **General API**: 200 requests per 15 minutes per IP.
- **Auth (`/auth/google-login`)**: 10 requests per 15 minutes per IP.

Configure in `src/config/security.js`.

## Secure Headers (Helmet)

- X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS (production), etc.

## CORS

- Production: set `CORS_ORIGIN` to a comma-separated list of allowed origins.
- Development: permissive for local testing.

## Body Size

- JSON body limit: 100 KB to reduce DoS risk.

## ORM (Sequelize)

- All DB access via Sequelize models (parameterized); no `sequelize.query()` with string interpolation of user input.
- Use transactions for multi-step writes (e.g. tenant + client creation).
