# AIRMAX system architecture

AIRMAX is split into three deployable applications and two infrastructure services. The mobile client and admin dashboard never communicate with PostgreSQL, Redis, payment providers, or MikroTik routers directly.

```text
React Native customer/admin mobile ─┐
                                    ├─ HTTPS / WebSocket ─ NestJS API ─ Prisma ─ PostgreSQL
Next.js operations dashboard ───────┘                       │
                                                            ├─ Redis (OTP, sessions, queues, cache)
                                                            └─ MikroTik adapter (server-side only)
```

## Trust and ownership boundaries

- Authentication issues short-lived access tokens and rotating refresh tokens. OTP challenges and revoked sessions live in Redis.
- Customer service owns profiles and connection metadata.
- Catalogue and subscription service owns packages and the one-active-subscription rule.
- Billing owns invoices, transactions, provider callbacks, and payment idempotency.
- Support owns complaints, technician assignment, status history, and customer replies.
- Network provisioning reacts to verified billing/subscription events. Router credentials are encrypted server-side and never reach clients.
- Reporting reads operational data through dedicated queries; it does not mutate source records.

## Role flows

Customer: authenticate → view catalogue → select package → create/settle invoice → activate subscription → backend provisions PPPoE profile. A late invoice triggers a reviewed suspension job, and verified payment triggers restoration.

Admin: authenticate → inspect dashboard → manage customers/packages/invoices/complaints → assign technicians → export reports. Every privileged mutation is protected by role guards and should be written to an audit log.

## API conventions

- Base URL: `/api/v1`; JSON uses camelCase and database columns use snake_case.
- Validation occurs at the API edge. Errors use `{ code, message, details, requestId }`.
- Mutating payment/network endpoints require an idempotency key.
- Pagination uses `cursor` and `limit`; filtering is explicit per endpoint.
- Socket rooms are scoped as `user:{id}`, `admin`, and `complaint:{id}`.

The concrete routes are documented in [server/README.md](../server/README.md), while the relational model is defined by [schema.prisma](../server/prisma/schema.prisma).
