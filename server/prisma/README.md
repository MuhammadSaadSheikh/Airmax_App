# AIRMAX production database foundation

This directory is the Phase 4.2 database authority. `schema.prisma` separates identity (`User`) from the business customer profile (`Customer`) and assigns commercial, billing, support, and field-service records to `Customer`. Authentication-adjacent `Notification` and `RefreshToken` models remain intact.

## Migration policy

`20260826000000_production_database_foundation` is a clean-install baseline because the repository previously contained no Prisma migrations. Its preflight intentionally refuses to run when transitional `User`, `Invoice`, or `Complaint` tables already exist. It never converts or deletes untracked data.

Before adopting an existing database, inventory and reconcile:

- `User` business columns and which customer-role users receive a `Customer` profile;
- `Subscription.userId`, `Invoice.userId`, `Payment.userId`, and `Complaint.userId` to new `Customer.id` values;
- invoice statuses `DRAFT`, `UNPAID`, `VOID`, and `REFUNDED`—there is no approved automatic mapping to the frozen v1 contract;
- immutable invoice customer/package/price/billing-period snapshots, which cannot be inferred safely after catalogue changes;
- payment status and attempt history absent from the transitional schema;
- `Complaint.technicianId` and `ComplaintEvent` into `TechnicianAssignment` and `ComplaintHistory` without treating the old field as authoritative;
- package duration and subscription expiry semantics against the new billing-period contract;
- duplicates that would violate customer, invoice, payment, package, or technician uniqueness.

After reconciliation is approved, produce a deployment-specific expand/backfill/validate/contract migration and only then use `prisma migrate resolve --applied` where the live schema is proven equivalent. Never mark this baseline applied merely to bypass the guard.

## Phase 4.3A backend boundary

The identity and customer backend now reads business profiles from `Customer`; it does not backfill transitional data. Existing `User.address`, `User.cnic`, `User.connectionId`, `User.installationDate`, and `User.routerDetails` values must be inventoried and copied into an explicitly matched `Customer` only after duplicate user/customer, CNIC, connection ID, and account-number conflicts are resolved. Authentication continues to use `User.id`, phone/email, password hash, role, status, and refresh tokens. JWT subjects remain `User.id`.

## Seed and verification

`seed.js` is repeatable and foundation-only: one catalogue fixture, one service area, and two skills. It creates no users, credentials, payments, or demo business history.

Static checks run without PostgreSQL:

```sh
DATABASE_URL=postgresql://airmax:airmax_local@localhost:5432/airmax npm run prisma:validate
npm run prisma:generate
npm run test:database
```

For a disposable PostgreSQL database only, run `prisma migrate deploy`, `prisma db seed`, and the database integration suite once one is provisioned. No real PostgreSQL database was assumed by the static tests.
