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

Start PostgreSQL and Redis with `docker compose up -d`, copy `.env.example` to `.env`, then run `npm install`, `npm run prisma:generate`, `npm run prisma:migrate`, and `npm run dev` in this directory.

Payment callbacks must be verified by the provider before calling the idempotent verification service. MikroTik credentials remain server-side; the adapter returns a queued response until configured.
