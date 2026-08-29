# AIRMAX database restore validation checklist

Use this checklist only against an approved isolated recovery target. Record
sanitized evidence for every item. Marking an item complete without evidence is
not validation.

## Target and recovery point

- [ ] Rehearsal/change ID recorded.
- [ ] Target host/database identity matches the isolated recovery approval.
- [ ] Target cannot receive production traffic.
- [ ] PostgreSQL version and extensions are compatible.
- [ ] TLS, private networking, encryption, and audit logging are enabled.
- [ ] Requested and actual recovery-point timestamps are recorded.
- [ ] Restore completed without partial/failure status.
- [ ] Source database was not modified.

## Migration and schema integrity

- [ ] `_prisma_migrations` exists and contains no failed/unfinished records.
- [ ] Migration names, order, and checksums match the selected release.
- [ ] No unexpected pending migrations exist for the selected application build.
- [ ] Required tables and enums exist.
- [ ] Required columns and data types match.
- [ ] Primary keys, foreign keys, unique constraints, and check constraints exist.
- [ ] Required indexes exist and are valid.
- [ ] Sequences/identity counters exceed current maximum identifiers.
- [ ] Ownership relations pass the Phase 5A.2.1 verification checks.
- [ ] Database statistics/maintenance needs are assessed before performance
      testing.

## Data completeness

- [ ] Expected table counts/control totals were approved before validation.
- [ ] Users and Customer ownership mappings reconcile.
- [ ] Active subscriptions reference valid customers and packages.
- [ ] Invoices reference the correct customer and subscription.
- [ ] Invoice immutable snapshots and statuses are populated consistently.
- [ ] Payments reference the correct customer and invoice.
- [ ] Payment amounts, statuses, attempts, and provider references reconcile.
- [ ] Paid invoices have valid successful payment/event evidence.
- [ ] Complaints reference valid customers and retain history.
- [ ] Technician assignments and work orders retain consistent complaint,
      customer, and technician ownership.
- [ ] Audit and history ledgers cover the approved recovery point.
- [ ] Notification and refresh-token rows meet the selected recovery policy.
- [ ] Required external attachment/provider references are reachable or recorded
      as controlled limitations.

## Financial validation

- [ ] Finance-approved invoice totals reconcile by status and period.
- [ ] Payment totals reconcile by status, provider, and settlement period.
- [ ] No duplicate idempotency keys or external references exist.
- [ ] No payment is attached to another customer's invoice.
- [ ] No invoice is marked paid without approved payment/event evidence.
- [ ] Refund and failed-attempt history remains intact.
- [ ] Differences from external provider/settlement records are investigated.

## Application validation

- [ ] Backend starts with rehearsal-scoped credentials.
- [ ] Liveness and readiness endpoints pass.
- [ ] Authentication succeeds without exposing production tokens.
- [ ] Customer profile read succeeds.
- [ ] Package/subscription read succeeds.
- [ ] Invoice/payment history reads succeed.
- [ ] Complaint list/detail and work-order tracking reads succeed.
- [ ] Admin operational reads required for incident validation succeed.
- [ ] Outbound payment, notification, and field-service side effects remain
      disabled.
- [ ] Representative query performance meets the rehearsal acceptance limit.

## Security and cleanup

- [ ] Validation output contains no credentials or unrestricted personal data.
- [ ] Access and provider operations are audit logged.
- [ ] Temporary identities and secrets have expiry/revocation owners.
- [ ] Restored data is not copied to uncontrolled storage or workstations.
- [ ] Rehearsal application access is disabled after validation.
- [ ] Temporary credentials are revoked.
- [ ] Recovery target deletion is completed and evidenced.

## Approval

- Database owner result:
- Infrastructure owner result:
- Application owner result:
- Security owner result:
- Finance/business reconciliation result:
- Measured RPO:
- Measured database/application/traffic RTO:
- Overall rehearsal status (`PASSED` or `FAILED`):
- Evidence record ID:
- Corrective actions and owners:
