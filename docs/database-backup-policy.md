# AIRMAX provider-neutral database backup policy

## Purpose and status

This policy defines the minimum production backup and recovery controls for the
AIRMAX PostgreSQL database. It is provider-neutral and does not authorize a
provider, create a backup job, execute a backup, or restore data.

Production remains **NO-GO** until an approved infrastructure owner maps every
requirement to a real provider control and a successful isolated restore
rehearsal proves recoverability.

## Data classification

Database backups inherit the production database's highest classification. They
contain identity information, password and refresh-token hashes, customer CNIC
and address data, subscriptions, invoices, payments, provider references,
complaints, field-service history, and audit records. Backup access must be at
least as restrictive as production database access.

Completed evidence records must never contain passwords, connection strings,
tokens, private keys, database URLs, provider API credentials, or encryption
key material.

## Required backup layers

An approved production design must provide all applicable layers:

1. **Continuous recovery/PITR** — provider-managed base backups and transaction
   log/WAL retention sufficient to recover to an approved timestamp.
2. **Pre-change recovery point** — a completed, protected provider snapshot or
   equivalent recovery point before every database migration window.
3. **Independent logical recovery copy** — a periodically generated encrypted
   PostgreSQL logical backup stored outside the primary database failure domain.
4. **Independent/immutable copy** — at least one copy protected from normal
   operator deletion and primary-account compromise for its approved retention.

A named Docker volume, replica, migration, SQL export retained on the database
host, or untested provider snapshot is not by itself a backup strategy.

## Backup lifecycle requirements

Every backup mechanism must define:

- schedule and responsible owner;
- production database target and recovery-point timestamp;
- completion/failure status and alerting;
- encryption in transit and at rest;
- integrity-verification method;
- retention expiry and deletion protection;
- storage failure domain, account/project, and region;
- approved backup and restore identities;
- access and deletion audit logs;
- restore compatibility and supported PostgreSQL versions;
- a tested restore path and last successful rehearsal;
- legal hold and secure deletion behavior.

Partial or failed backups must be marked unusable and must never satisfy a
deployment approval gate.

## Recovery objectives

RPO and RTO are business decisions. They must be approved using
[`database-rpo-rto-approval-template.md`](database-rpo-rto-approval-template.md)
before provider configuration. The policy must use the strictest approved RPO
for the shared database unless the architecture proves a stronger independent
control for a domain.

No command, schedule, or retention duration in documentation is an approved
production objective until the completed approval record names its owners and
effective date.

## Retention requirements

The approved retention schedule must separately cover:

- PITR window;
- daily, weekly, and monthly recovery points;
- pre-migration recovery points;
- independent logical copies;
- incident and legal holds;
- restore-rehearsal evidence and deployment reports;
- deletion approval and expiry monitoring.

Finance, security, privacy, and legal owners must approve any financial or
personal-data retention period. Expired backups must be securely deleted unless
an active hold applies.

## Security requirements

- Encrypt backup data in transit and at rest with an approved key-management
  boundary.
- Separate backup administration, restore authority, and application runtime
  access where the provider permits it.
- Restrict backup listing, download, restore, and deletion independently.
- Require strong authentication and audited break-glass access.
- Protect at least one recovery copy from routine deletion and primary-account
  compromise.
- Rotate backup and restore credentials according to the production secret
  policy.
- Monitor access, failed jobs, stale recovery points, retention expiry, key
  errors, and unauthorized deletion attempts.
- Never restore production data onto developer workstations or uncontrolled
  environments.

## Backup evidence contract

Every recovery point used for deployment approval must have a sanitized JSON
evidence manifest based on
[`database-backup-evidence.example.json`](database-backup-evidence.example.json).
The manifest records assertions and audit references; it does not contain the
backup and does not prove provider existence by itself.

Before deployment, an operator must:

1. verify the object in the provider control plane using approved access;
2. create the sanitized manifest outside the source repository;
3. validate it with the local read-only command;
4. attach the provider evidence, validator output, and approval record to the
   change ticket.

```bash
npm --prefix server run db:backup:evidence:validate -- /secure/path/evidence.json
```

The validator performs no provider or database call. It checks manifest shape,
target binding, approved backup reference, freshness, retention, encryption,
access-control and immutability assertions, integrity evidence, and recent
restore-rehearsal evidence. A passing result cannot replace provider evidence or
a restore test.

## Restore testing

Run rehearsals only in an isolated, approved non-production target by following
[`database-restore-rehearsal-runbook.md`](database-restore-rehearsal-runbook.md).
Validate the result with
[`database-restore-validation-checklist.md`](database-restore-validation-checklist.md).

The owner-approved schedule must include:

- a rehearsal before initial production launch;
- a rehearsal after material provider or PostgreSQL changes;
- recurring exercises within the approved maximum restore-test age;
- an exercise after any backup or restore incident.

## Monitoring and audit evidence

Operational monitoring must alert before RPO or retention objectives are
breached. The change/incident system must retain sanitized evidence of backup
completion, recovery point, restore rehearsal, validation results, owners, and
decisions. Source control is not the evidence store.

## Prohibited actions

- Treating an identifier or validator result as proof that a backup exists.
- Restoring over the production database without a separately approved recovery
  change.
- Direct table or row restoration into production without isolated recovery and
  reviewed reconciliation.
- Storing provider credentials or production backup manifests in this
  repository.
- Automatic restore, automatic rollback, or automatic `prisma migrate resolve`.
