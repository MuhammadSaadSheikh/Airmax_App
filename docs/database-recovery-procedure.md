# AIRMAX database migration recovery procedure

This is a decision runbook, not an executable rollback. AIRMAX intentionally has
no automatic rollback and no automatic `prisma migrate resolve` path.

Use the detailed
[`database-recovery-checklist.md`](database-recovery-checklist.md) during an
incident and the
[`database-restore-rehearsal-runbook.md`](database-restore-rehearsal-runbook.md)
for non-production recovery exercises.

## On any migration or verification failure

1. Stop the deployment and keep traffic in the approved maintenance state.
2. Preserve the sanitized deployment report, application logs, PostgreSQL logs,
   provider event logs, release SHA, and exact failure time.
3. Do not rerun `db:deploy:safe`, edit migration SQL, execute ad hoc DDL, or run
   `prisma migrate resolve`.
4. Notify the database, release, and incident owners.
5. Determine whether the failure occurred before DDL, during DDL, after migration
   recording, or during application/health verification.

## Assessment

The database owner must inspect `_prisma_migrations`, PostgreSQL transaction and
server logs, current schema objects, active locks, and backup/PITR availability.
Compare the current database with the immutable release migrations and the
sanitized preflight report. Do not expose connection strings in the incident
record.

Possible recovery choices require explicit database-owner and incident-owner
approval:

- If no DDL ran, correct the external cause and schedule a new deployment.
- If a transactional migration failed and PostgreSQL rolled it back completely,
  prove the schema and migration record state before scheduling a new attempt.
- If DDL or data changed partially, keep the application stopped and create a
  reviewed, deployment-specific recovery plan. Do not improvise a migration.
- If compatibility cannot be proven, restore the approved snapshot or perform
  provider-managed point-in-time recovery into a verified target.
- Roll back the application only when the prior version is proven compatible
  with the current database state. An application rollback is not a database
  rollback.

## Restore verification

Restore operations belong to the database provider/runbook and must never target
the live database without a separately approved recovery change. Validate a
restored target before cutover:

- target identity, TLS, access restrictions, and restore timestamp;
- migration history, checksums, required schema objects, and ownership checks;
- row-count and business reconciliation controls approved for the incident;
- API startup, live/ready health, authentication, and critical customer flows;
- DNS/connection target and runtime role permissions.

The complete database, financial, application, security, and cleanup controls
are defined in
[`database-restore-validation-checklist.md`](database-restore-validation-checklist.md).

Record recovery evidence and the final incident decision. Only an explicitly
reviewed repair may use `prisma migrate resolve`; this tool never performs it.
