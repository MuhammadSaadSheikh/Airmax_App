# AIRMAX database restore rehearsal runbook

## Purpose

This runbook defines a provider-neutral rehearsal. It does not authorize a
production restore or prescribe provider commands. The infrastructure/database
owner must supply separately reviewed provider steps for the selected service.

The rehearsal target must be isolated, non-production, access-restricted, and
approved for production-class personal and financial data.

## Required approvals and roles

Before starting, record:

- rehearsal/change ID;
- database owner;
- infrastructure owner;
- application owner;
- security owner;
- incident/rehearsal coordinator;
- approved backup and recovery-point identifiers;
- source and target classifications;
- authorized rehearsal window and deletion deadline.

No person may infer approval from repository access or from a passing evidence
validator.

## Preconditions

- Backup provider/object existence was verified independently.
- Backup completion, recovery point, encryption, retention, and integrity
  evidence are attached to the rehearsal record.
- The target cannot route production traffic or send customer notifications.
- External payment/provider callbacks and field-service integrations are
  disabled or isolated.
- Target networking, DNS, security groups, credentials, and secret-store entries
  are non-production scoped.
- PostgreSQL and required extension/version compatibility are documented.
- Storage and restore-capacity estimates are approved.
- The target deletion and credential-revocation owner is assigned.
- The validation checklist and expected business control totals are ready.

If any precondition is false, stop before requesting a provider restore.

## Rehearsal procedure

### 1. Record the baseline

Record the selected backup ID, requested recovery timestamp, actual available
recovery point, expected PostgreSQL version, database size, object count if
available, and rehearsal start time. Never copy credentials into the record.

### 2. Provision the isolated target

Using the separately approved provider procedure, create a new recovery target.
Do not overwrite or repoint production. Confirm encryption, private networking,
logging, least-privilege access, and automatic expiry/deletion controls.

### 3. Restore the selected recovery point

The database/infrastructure owner performs the provider-approved restore action.
Record provider operation IDs and timestamps, but not URLs containing
credentials. Do not execute ad hoc SQL repairs or `prisma migrate resolve`.

### 4. Establish controlled application access

Create temporary rehearsal-scoped runtime and verification identities. Connect
only an isolated AIRMAX backend build matching the selected recovery point.
Disable outbound side effects. Confirm the target identity before any query.

### 5. Validate the restore

Complete every applicable item in
[`database-restore-validation-checklist.md`](database-restore-validation-checklist.md).
Capture sanitized outputs and failures in the rehearsal record.

### 6. Measure recovery objectives

Record:

- backup recovery point and actual data-loss interval;
- provider restore start/completion duration;
- database validation duration;
- application startup and critical-flow validation duration;
- total time until a hypothetical traffic-reopening approval;
- whether approved RPO/RTO targets were met.

### 7. Review and close

All owners review failures, accepted limitations, and corrective actions. A
rehearsal passes only when database, business, security, and application checks
pass and the measured objectives meet approved limits.

Revoke temporary access, disconnect the rehearsal application, securely delete
the restored target according to policy, and retain provider deletion evidence.

## Stop conditions

Stop and escalate if:

- target identity is ambiguous or resembles production;
- the backup/recovery point differs from approval;
- encryption, access restrictions, or audit logging are missing;
- credentials or production callbacks could escape the rehearsal boundary;
- restore output indicates corruption, version mismatch, or partial completion;
- schema, ownership, financial, or audit-history validation fails;
- provider actions would modify the source database;
- the approved window or authority expires.

## Required rehearsal evidence

- Provider operation/reference IDs and sanitized timestamps.
- Backup evidence validator output.
- Actual recovery point and measured RPO/RTO.
- Completed restore-validation checklist.
- Database, application, security, and business owner approvals.
- Failure/corrective-action list.
- Target deletion and temporary credential revocation evidence.

The resulting rehearsal evidence ID is referenced by future backup evidence
manifests. It does not make future backups automatically restorable.
