# AIRMAX database deployment runbook

This runbook is the production database deployment boundary for Phase 5A.2.1.
The wrapper validates and reports; it does not back up, reconcile data, repair a
failed migration, roll back, or run `prisma migrate resolve`.

## Roles and separation of duties

- The release owner identifies the immutable release SHA and approves the
  application release.
- The database owner confirms the exact PostgreSQL target, backup evidence,
  maintenance window, capacity, and database access.
- The incident owner is available throughout deployment and owns any recovery
  decision.
- The operator uses a dedicated migration identity. The normal application
  runtime identity should not receive DDL privileges.

One person may fill multiple roles in a small environment, but the recorded
approvals and evidence remain mandatory.

## Required environment

Inject values through the deployment platform or a managed secret store. Do not
write a production `.env` file into the release checkout.

| Variable                            | Requirement                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `NODE_ENV`                          | Exactly `production`                                                                         |
| `DATABASE_URL`                      | PostgreSQL URL for the migration role, with `sslmode=require`, `verify-ca`, or `verify-full` |
| `AIRMAX_DB_EXPECTED_HOST`           | Exact approved database host                                                                 |
| `AIRMAX_DB_EXPECTED_PORT`           | Exact approved port; defaults to `5432`                                                      |
| `AIRMAX_DB_EXPECTED_NAME`           | Exact approved database name                                                                 |
| `AIRMAX_DB_DEPLOY_MODE`             | `greenfield` for an empty target or `tracked` for a Prisma-managed target                    |
| `AIRMAX_RELEASE_SHA`                | 7–64 hexadecimal characters; use the deployed Git SHA                                        |
| `AIRMAX_DB_DEPLOY_APPROVAL`         | Exactly `APPROVED`                                                                           |
| `AIRMAX_DB_MAINTENANCE_APPROVAL`    | Exactly `APPROVED`                                                                           |
| `AIRMAX_DB_BACKUP_REFERENCE`        | Provider snapshot/backup identifier recorded by the database owner                           |
| `AIRMAX_BACKUP_EVIDENCE_FILE`       | Path to a sanitized local evidence manifest; never a backup or credential file               |
| `AIRMAX_BACKUP_MAX_AGE_MINUTES`     | Owner-approved maximum recovery-point age                                                    |
| `AIRMAX_BACKUP_MIN_RETENTION_HOURS` | Owner-approved minimum remaining retention                                                   |
| `AIRMAX_RESTORE_TEST_MAX_AGE_DAYS`  | Owner-approved maximum age of passing restore-rehearsal evidence                             |
| `AIRMAX_HEALTH_BASE_URL`            | Optional HTTPS API origin for live/ready postflight hooks                                    |
| `AIRMAX_DB_REPORT_DIR`              | Optional protected report directory; defaults to `server/artifacts/database-deployment`      |

`AIRMAX_MIGRATIONS_DIR` exists only for controlled packaging layouts. The
default release path is preferred. A local/private database target, missing TLS,
unexpected database identity, dirty release tree, or release SHA mismatch fails
closed.

## Approval checklist

Record this checklist in the change ticket before invoking the safe wrapper.

- [ ] Release SHA reviewed, built, immutable, and matches `AIRMAX_RELEASE_SHA`.
- [ ] Target host, port, and database approved and pinned in the expected-target
      variables.
- [ ] Deployment mode confirmed from the target: empty `greenfield` or existing
      Prisma-managed `tracked`.
- [ ] Managed backup/snapshot completed and its identifier recorded.
- [ ] Provider object independently verified and sanitized evidence manifest
      passes the read-only validator.
- [ ] Restore procedure and required restore time confirmed by the database
      owner.
- [ ] Maintenance window and user impact approved.
- [ ] Database connection headroom, storage headroom, and DDL lock impact
      reviewed using provider tooling.
- [ ] Migration role granted only the access required for the window.
- [ ] Runtime database role remains separate and least privileged.
- [ ] Incident owner, escalation channel, and application rollback artifact are
      ready.
- [ ] Existing-data reconciliation is complete for non-greenfield cutovers.

## Deployment procedure

From the immutable server release, install locked dependencies and generate the
Prisma client before the maintenance window:

```bash
npm ci
npm run prisma:generate
npm run build
```

Then execute:

```bash
npm run db:backup:evidence:validate -- /secure/path/evidence.json
npm run db:deploy:preflight
npm run db:deploy:safe
npm run db:deploy:verify
```

`db:deploy:preflight` is read-only. It validates the production environment,
target identity and permissions, PostgreSQL/TLS requirements, migration
directory/order/checksums, failed or unknown migration records, pending
migrations, and the release state.

`db:backup:evidence:validate` reads only the supplied JSON manifest. It checks
target binding, freshness, retention/immutability, security assertions,
integrity evidence, and restore-rehearsal evidence. It does not contact or prove
the existence of a provider backup. Follow the
[`database-backup-policy.md`](database-backup-policy.md) and attach independent
provider evidence to the change record.

`db:deploy:safe` repeats preflight, invokes `prisma migrate deploy` once, and
then runs postflight. It never retries, resolves, or rolls back automatically.

`db:deploy:verify` is read-only. It requires a fully applied tracked migration
history, validates required tables, enums, ownership columns and foreign keys,
checks ownership consistency, runs `prisma migrate status`, and optionally calls
the API live/ready endpoints.

Every command writes a mode-`0600` JSON report in a mode-`0700` directory. The
report includes the release, sanitized target, migration state, and outcome; it
does not include `DATABASE_URL` or database credentials. Retain the report with
the change ticket according to the organization’s deployment audit policy.

## Stop conditions

Stop the deployment immediately if any command fails or if the observed target,
approval, backup, migration state, lock impact, or application state differs
from the approved change. Do not edit a migration, bypass the wrapper, rerun a
failed migration, or use `prisma migrate resolve` during incident response.

Proceed to application rollout only after postflight passes. If the optional
health hooks were not configured, validate live, ready, authentication, and the
critical customer APIs manually before reopening traffic.

## Remaining external controls

The wrapper cannot prove that the referenced backup exists, acquire a provider
snapshot, guarantee point-in-time recovery, predict all DDL lock duration,
separate database credentials, or authorize a maintenance window. These remain
operator/provider controls and are production blockers until established.
