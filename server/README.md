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

Start PostgreSQL and Redis with `docker compose up -d`, copy `.env.example` to `.env`, then run `npm install`, `npm run prisma:generate`, `npm run prisma:migrate`, and `npm run dev` in this directory.

Payment callbacks must be verified by the provider before calling the idempotent verification service. MikroTik credentials remain server-side; the adapter returns a queued response until configured.
