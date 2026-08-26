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

## Phase 4.3B package and subscription boundary

Package and subscription backend operations now use `Customer -> Subscription -> Package` and write subscription lifecycle history. They do not backfill transitional records. Existing `Subscription.userId` values require an approved mapping from `User.id` to `Customer.id`; `expiresAt` requires an explicit `endsAt` policy; and legacy package `durationDays` values require business-approved `BillingPeriod` mapping. Package IDs must be reconciled before subscription foreign keys are moved. Missing creation, activation, cancellation, and package-change events cannot be invented silently. Package-change backfills must capture immutable previous/current name, speed, price, and billing-period facts from a trusted historical source rather than today’s catalogue values.

## Phase 4.3C billing and payment boundary

Billing now uses `Customer -> Subscription -> Invoice -> Payment -> PaymentAttempt`; it does not backfill transitional financial records. Existing `Invoice.userId` and `Payment.userId` values require an approved `User.id -> Customer.id` mapping. Legacy invoice statuses `DRAFT`, `UNPAID`, `VOID`, and `REFUNDED` have no automatic mapping to the frozen invoice contract and must be reconciled case by case. Missing customer/package/price/billing-period snapshots must come from trusted historical evidence, never the current catalogue by assumption. Payment status, idempotency, external references, attempts, failures, and refund history must be inventoried before backfill. Missing attempts or invoice events must not be fabricated.

## Phase 4.3D complaint and field-service boundary

The additive `20260826010000_phase_43d_assignment_actor` amendment introduces
`ON_LEAVE` without renaming or migrating `INACTIVE`. Both values remain valid and
semantically distinct. Before importing historical technician data, operations
must reconcile whether each legacy inactive record means temporarily on leave or
truly inactive; the migration intentionally makes no such business decision.

`TechnicianAssignment.assignedById` is nullable so historical rows can remain
intact when their actor is unknown. Its user relation uses `ON DELETE SET NULL`
to preserve assignment history. Phase 4.3D application services require an
authenticated admin actor for every newly created assignment. Historical NULL
actors must be reconciled only from trustworthy audit evidence and must never be
guessed.

No production data migration is included. A deployment-specific plan must map
legacy `User` complaint ownership to verified `Customer.id` values, reconcile old
technician identifiers without treating technicians as user accounts, and map
legacy complaint statuses to the production lifecycle. Missing assignment,
work-order, field-visit, resolution, or actor history must not be invented. Any
technician-account linkage in an older deployment remains a reconciliation input,
not a reason to change the independent production `Technician` entity.

## Seed and verification

`seed.js` is repeatable and foundation-only: one catalogue fixture, one service area, and two skills. It creates no users, credentials, payments, or demo business history.

Static checks run without PostgreSQL:

```sh
DATABASE_URL=postgresql://airmax:airmax_local@localhost:5432/airmax npm run prisma:validate
npm run prisma:generate
npm run test:database
```

For a disposable PostgreSQL database only, run `prisma migrate deploy`, `prisma db seed`, and the database integration suite once one is provisioned. No real PostgreSQL database was assumed by the static tests.
