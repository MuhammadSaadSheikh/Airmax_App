# AIRMAX API

NestJS REST API for the AIRMAX mobile client and Next.js operations dashboard.

## Route map

- `POST /api/v1/auth/login|register|otp|otp/verify`
- `GET /api/v1/users`, `GET /users/:id`
- `GET|POST /api/v1/packages`, `PATCH|DELETE /packages/:id`
- `GET|POST /api/v1/subscriptions`
- `GET /api/v1/payments`, `POST /payments/verify`
- `GET|POST /api/v1/complaints`, `PATCH /complaints/:id`
- `GET|POST /api/v1/technicians`
- `GET /api/v1/notifications`, `PATCH /notifications/:id/read`
- `GET /api/v1/reports/analytics`
- `GET /api/v1/health/live`, `GET /api/v1/health/ready`

All JSON endpoints use the shared `{ data, meta, errors }` envelope. The API
accepts a safe `X-Request-Id` value (letters, digits, `.`, `_`, `:`, or `-`, up
to 128 characters), generates one otherwise, and echoes it in both the response
header and envelope metadata. `204` responses and file/CSV responses are not
wrapped.

Future list endpoints should use the shared opaque cursor helpers in
`src/common/pagination/cursor-pagination.ts`; Phase 4.1 does not migrate existing
business lists to cursor pagination.

For local development, start PostgreSQL and Redis with `docker compose up -d`,
copy `.env.example` to `.env`, then run `npm ci`, `npm run prisma:generate`,
`npm run prisma:migrate`, and `npm run dev` in this directory.

Production must inject configuration through the deployment environment with an
explicit `NODE_ENV=production`. Required values include PostgreSQL with TLS,
Redis with `rediss://`, HTTPS `ADMIN_ORIGIN`, distinct JWT access/refresh
secrets, issuer, audience, and OTP pepper. Local hosts, example credentials,
debug logging, incomplete MikroTik configuration, and repository-local `.env`
loading are rejected in production. The authoritative variable checklist and
safe placeholders are documented in `.env.example`.

After producing the API build, use only the fail-closed database deployment
wrapper:

```bash
npm run db:deploy:preflight
npm run db:deploy:safe
npm run db:deploy:verify
npm run start:prod
```

`prisma:migrate` remains the local development command and must not be used as a
production deployment step. Direct `prisma migrate deploy` is deliberately not
exposed as a package script. See
[`../docs/database-deployment-runbook.md`](../docs/database-deployment-runbook.md)
for approvals, backup requirements, failure recovery, and sanitized reports.
The provider-neutral backup policy, evidence manifest contract, and isolated
restore rehearsal process are documented in
[`../docs/database-backup-policy.md`](../docs/database-backup-policy.md).

Payment callbacks must be verified by the provider before calling the idempotent verification service. MikroTik credentials remain server-side; the adapter returns a queued response until configured.
