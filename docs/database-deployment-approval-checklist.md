# AIRMAX database deployment approval record

Copy this template into the release/change record. Do not commit completed
production values or secrets to the repository.

## Release

- Change/release ID:
- Immutable release SHA:
- Release owner and approval time:
- Application rollback artifact:

## Database target

- Approved hostname (no credentials):
- Port:
- Database name:
- Deployment mode (`greenfield` or `tracked`):
- Database owner and approval time:
- Dedicated migration identity confirmed:
- Runtime/migration identity separation confirmed:

## Safety evidence

- Backup/snapshot reference:
- Sanitized backup evidence manifest reference:
- Backup evidence validator outcome:
- Provider control-plane verification reference:
- Backup completion time:
- Actual recovery-point time:
- Remaining retention/immutability expiry:
- Last passing restore-rehearsal evidence ID/date:
- Restore process and recovery objective verified:
- Maintenance window:
- DDL lock/capacity review reference:
- Existing-data reconciliation reference, if applicable:
- Incident owner and escalation channel:

## Execution evidence

- Preflight report reference and outcome:
- Safe deployment report reference and outcome:
- Verification report reference and outcome:
- Health/manual smoke-test evidence:
- Migration-role privilege removal/rotation confirmed:
- Change closure owner and time:

Approval values used by the wrapper are gates, not substitutes for this reviewed
record. Never paste `DATABASE_URL`, passwords, tokens, certificates, or private
keys into this document.
