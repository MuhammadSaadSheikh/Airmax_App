# AIRMAX database recovery and ownership checklist

This is a human-controlled incident checklist. It does not authorize or automate
a restore, rollback, migration repair, or `prisma migrate resolve`.

## Recovery ownership record

- [ ] Incident commander named and reachable.
- [ ] Database owner named and reachable.
- [ ] Infrastructure/provider owner named and reachable.
- [ ] Application owner named and reachable.
- [ ] Security owner named and reachable.
- [ ] Finance/business reconciliation owner named and reachable.
- [ ] Communications owner and escalation channel recorded.
- [ ] Restore approvers and traffic-reopening approvers recorded.
- [ ] Break-glass access owner and expiry recorded.
- [ ] Evidence custodian and incident record location recorded.

## Immediate containment

- [ ] Incident/change ID and exact detection time recorded.
- [ ] Migration/deployment or damaging operation stopped.
- [ ] Traffic and write behavior placed in the approved safe state.
- [ ] Automatic retries and repair actions disabled.
- [ ] Logs, deployment reports, provider events, release SHA, and timestamps
      preserved.
- [ ] No credentials copied into incident records.
- [ ] Source database identity and current state confirmed read-only where safe.

## Decision inputs

- [ ] Failure stage identified: before DDL, during DDL, after migration record, or
      application verification.
- [ ] Source database availability and corruption scope assessed.
- [ ] `_prisma_migrations`, schema, locks, and transaction state assessed.
- [ ] Approved application rollback artifact identified.
- [ ] Backup/PITR candidates and actual recovery points independently verified.
- [ ] Expected data loss measured against approved RPO.
- [ ] Estimated restore and service recovery measured against approved RTO.
- [ ] Financial and operational reconciliation impact assessed.
- [ ] Legal/security notification requirements assessed.

## Recovery decision

- [ ] Database and incident owners approve one documented path.
- [ ] No-action/retry path proves no partial database change.
- [ ] Application rollback path proves compatibility with current schema.
- [ ] Restore path targets a new isolated database first.
- [ ] Any repair migration or `migrate resolve` has separate expert review and
      approval.
- [ ] Production overwrite, direct table restore, and ad hoc DDL remain
      prohibited unless separately approved through emergency change control.

## Restore and validation

- [ ] Provider-specific recovery procedure reviewed for this incident.
- [ ] Backup evidence and selected timestamp attached.
- [ ] Restore target identity, encryption, access, and network isolation proven.
- [ ] Restore operation ID and timings recorded.
- [ ] Restore validation checklist completed.
- [ ] Financial/customer/operational differences reconciled.
- [ ] Application health and critical flows pass.
- [ ] Security owner approves restored-target access state.

## Cutover and closure

- [ ] Final source/target identity and connection change peer reviewed.
- [ ] Runtime credentials and pool restart plan approved.
- [ ] Monitoring and rollback observation window active.
- [ ] Incident commander authorizes traffic reopening.
- [ ] Customer/internal communications executed if required.
- [ ] Temporary access revoked and unused restored targets deleted.
- [ ] Final RPO/RTO, data loss, outage, and decisions recorded.
- [ ] Corrective actions, owners, due dates, and next rehearsal scheduled.
