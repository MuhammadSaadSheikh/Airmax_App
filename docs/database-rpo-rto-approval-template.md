# AIRMAX database RPO/RTO approval template

Copy this template into the approved change/risk system. Do not commit completed
production details or personal contact information to the repository.

## Approval metadata

- Record ID:
- Effective date:
- Review/expiry date:
- Database service/provider tier:
- Production data-volume estimate:
- Peak write/transaction rate:
- Business owner:
- Finance owner:
- Database/infrastructure owner:
- Application owner:
- Security/privacy owner:
- Final risk approver:

## Domain recovery point objectives

| Domain                        | Maximum approved data loss | Consistency requirements                         | Approver |
| ----------------------------- | -------------------------- | ------------------------------------------------ | -------- |
| Identity and customers        |                            | User-to-Customer ownership intact                |          |
| Packages and subscriptions    |                            | Active ownership and lifecycle intact            |          |
| Invoices and events           |                            | Immutable snapshots and event history reconcile  |          |
| Payments and attempts         |                            | Provider/ledger totals and idempotency reconcile |          |
| Complaints and work orders    |                            | Customer, assignment, and history integrity      |          |
| Notifications/session records |                            | Approved session invalidation behavior           |          |

Shared-database RPO selected:

Reason the selected RPO satisfies the strictest domain:

## Recovery time objectives

| Milestone                       | Maximum approved duration | Measurement start/end | Approver |
| ------------------------------- | ------------------------- | --------------------- | -------- |
| Incident detection and decision |                           |                       |          |
| Provider restore                |                           |                       |          |
| Database validation             |                           |                       |          |
| Application startup/validation  |                           |                       |          |
| Traffic restoration             |                           |                       |          |
| Full operational reconciliation |                           |                       |          |

Overall service RTO selected:

## Backup and retention mapping

- PITR window supporting the RPO:
- Snapshot/logical backup schedule:
- Daily/weekly/monthly retention:
- Pre-migration recovery-point retention:
- Independent/immutable copy requirement:
- Cross-region/account requirement:
- Legal/financial hold requirements:
- Monitoring threshold before RPO breach:

## Rehearsal evidence

- Last successful rehearsal ID/date:
- Backup type and recovery point tested:
- Measured RPO:
- Measured restore, application, and total RTO:
- Unresolved limitations:
- Next rehearsal due:

## Risk acceptance

- Expected business impact at the approved RPO:
- Expected customer impact at the approved RTO:
- Financial reconciliation process:
- Manual workarounds during recovery:
- Cost/capability tradeoffs accepted:
- Conditions that require immediate reapproval:

## Sign-off

- Business/finance approval:
- Database/infrastructure approval:
- Application approval:
- Security/privacy approval:
- Final production-risk approval:
