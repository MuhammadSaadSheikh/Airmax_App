const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');

const {
  BackupEvidenceError,
  loadBackupEvidenceConfig,
  validateBackupEvidence,
  validateBackupEvidenceFile,
} = require('../scripts/database/backup-evidence');

const now = new Date('2026-08-30T00:00:00.000Z');

function environment(overrides = {}) {
  return {
    AIRMAX_BACKUP_MAX_AGE_MINUTES: '30',
    AIRMAX_BACKUP_MIN_RETENTION_HOURS: '24',
    AIRMAX_DB_BACKUP_REFERENCE: 'backup-release-20260830',
    AIRMAX_DB_EXPECTED_HOST: 'db.airmax.example',
    AIRMAX_DB_EXPECTED_NAME: 'airmax',
    AIRMAX_DB_EXPECTED_PORT: '5432',
    AIRMAX_RESTORE_TEST_MAX_AGE_DAYS: '90',
    NODE_ENV: 'production',
    ...overrides,
  };
}

function evidence(overrides = {}) {
  return {
    backupId: 'backup-release-20260830',
    backupType: 'snapshot',
    completedAt: '2026-08-29T23:57:00.000Z',
    environment: 'production',
    evidenceId: 'evidence-20260830-001',
    expiresAt: '2026-09-07T00:00:00.000Z',
    integrity: {
      method: 'provider_status',
      verifiedAt: '2026-08-29T23:58:00.000Z',
      verifiedBy: 'database-operations',
    },
    recoveryPointAt: '2026-08-29T23:55:00.000Z',
    restoreTest: {
      completedAt: '2026-08-01T12:00:00.000Z',
      evidenceId: 'restore-rehearsal-20260801',
      status: 'PASSED',
      verifiedBy: 'recovery-owner',
    },
    schemaVersion: 1,
    security: {
      accessControlled: true,
      encryptedAtRest: true,
      encryptedInTransit: true,
      immutableUntil: '2026-09-07T00:00:00.000Z',
    },
    startedAt: '2026-08-29T23:50:00.000Z',
    status: 'COMPLETED',
    target: {
      databaseName: 'airmax',
      host: 'db.airmax.example',
      port: 5432,
    },
    ...overrides,
  };
}

function expectCode(action, code) {
  assert.throws(action, error => {
    assert.ok(error instanceof BackupEvidenceError);
    assert.equal(error.code, code);
    return true;
  });
}

test('provider-neutral snapshot evidence validates without external access', () => {
  const report = validateBackupEvidence(
    evidence(),
    loadBackupEvidenceConfig(environment()),
    now,
  );
  assert.equal(report.outcome, 'passed');
  assert.equal(report.backupId, 'backup-release-20260830');
  assert.equal(report.restoreTest.status, 'PASSED');
  assert.deepEqual(report.target, {
    databaseName: 'airmax',
    host: 'db.airmax.example',
    port: '5432',
  });
});

test('file validator reads a bounded local JSON manifest only', t => {
  const directory = mkdtempSync(join(tmpdir(), 'airmax-backup-evidence-'));
  t.after(() => rmSync(directory, { force: true, recursive: true }));
  const file = join(directory, 'evidence.json');
  writeFileSync(file, JSON.stringify(evidence()), { mode: 0o600 });
  const report = validateBackupEvidenceFile(file, environment(), now);
  assert.equal(report.outcome, 'passed');
  assert.equal(report.evidenceId, 'evidence-20260830-001');
});

test('configuration requires production and explicit recovery limits', () => {
  expectCode(
    () => loadBackupEvidenceConfig(environment({ NODE_ENV: 'test' })),
    'BACKUP_EVIDENCE_CONFIG_INVALID',
  );
  expectCode(
    () =>
      loadBackupEvidenceConfig(
        environment({ AIRMAX_BACKUP_MAX_AGE_MINUTES: undefined }),
      ),
    'BACKUP_EVIDENCE_CONFIG_INVALID',
  );
  expectCode(
    () =>
      loadBackupEvidenceConfig(
        environment({ AIRMAX_DB_EXPECTED_HOST: '127.0.0.1' }),
      ),
    'BACKUP_EVIDENCE_CONFIG_INVALID',
  );
});

test('evidence must match the approved backup reference and database target', () => {
  const config = loadBackupEvidenceConfig(environment());
  expectCode(
    () =>
      validateBackupEvidence(
        evidence({ backupId: 'another-backup' }),
        config,
        now,
      ),
    'BACKUP_EVIDENCE_TARGET_MISMATCH',
  );
  expectCode(
    () =>
      validateBackupEvidence(
        evidence({
          target: {
            databaseName: 'airmax_test',
            host: 'db.airmax.example',
            port: 5432,
          },
        }),
        config,
        now,
      ),
    'BACKUP_EVIDENCE_TARGET_MISMATCH',
  );
});

test('stale recovery points and insufficient retention fail closed', () => {
  const config = loadBackupEvidenceConfig(environment());
  expectCode(
    () =>
      validateBackupEvidence(
        evidence({
          startedAt: '2026-08-29T19:50:00.000Z',
          recoveryPointAt: '2026-08-29T19:55:00.000Z',
          completedAt: '2026-08-29T19:57:00.000Z',
          integrity: {
            method: 'provider_status',
            verifiedAt: '2026-08-29T19:58:00.000Z',
            verifiedBy: 'database-operations',
          },
        }),
        config,
        now,
      ),
    'BACKUP_EVIDENCE_STALE',
  );
  expectCode(
    () =>
      validateBackupEvidence(
        evidence({ expiresAt: '2026-08-30T12:00:00.000Z' }),
        config,
        now,
      ),
    'BACKUP_EVIDENCE_RETENTION_FAILED',
  );
});

test('encryption, access control, and immutability are mandatory', () => {
  const config = loadBackupEvidenceConfig(environment());
  const unencrypted = evidence();
  unencrypted.security.encryptedAtRest = false;
  expectCode(
    () => validateBackupEvidence(unencrypted, config, now),
    'BACKUP_EVIDENCE_SECURITY_FAILED',
  );

  const mutable = evidence();
  mutable.security.immutableUntil = '2026-08-30T12:00:00.000Z';
  expectCode(
    () => validateBackupEvidence(mutable, config, now),
    'BACKUP_EVIDENCE_RETENTION_FAILED',
  );
});

test('logical backups require a SHA-256 integrity digest', () => {
  const config = loadBackupEvidenceConfig(environment());
  expectCode(
    () =>
      validateBackupEvidence(evidence({ backupType: 'logical' }), config, now),
    'BACKUP_EVIDENCE_INTEGRITY_FAILED',
  );

  const logical = evidence({
    backupType: 'logical',
    integrity: {
      digest: 'a'.repeat(64),
      method: 'sha256',
      verifiedAt: '2026-08-29T23:58:00.000Z',
      verifiedBy: 'database-operations',
    },
  });
  assert.equal(validateBackupEvidence(logical, config, now).outcome, 'passed');
});

test('stale or failed restore rehearsal evidence is rejected', () => {
  const config = loadBackupEvidenceConfig(environment());
  const failed = evidence();
  failed.restoreTest.status = 'FAILED';
  expectCode(
    () => validateBackupEvidence(failed, config, now),
    'BACKUP_EVIDENCE_RESTORE_TEST_FAILED',
  );

  const stale = evidence();
  stale.restoreTest.completedAt = '2025-01-01T00:00:00.000Z';
  expectCode(
    () => validateBackupEvidence(stale, config, now),
    'BACKUP_EVIDENCE_RESTORE_TEST_FAILED',
  );
});

test('evidence rejects credential fields and embedded connection secrets', () => {
  const config = loadBackupEvidenceConfig(environment());
  expectCode(
    () =>
      validateBackupEvidence(
        { ...evidence(), password: 'must-not-appear' },
        config,
        now,
      ),
    'BACKUP_EVIDENCE_SECRET_DETECTED',
  );
  const embedded = evidence();
  embedded.integrity.verifiedBy =
    'postgresql://operator:secret@db.airmax.example/airmax';
  expectCode(
    () => validateBackupEvidence(embedded, config, now),
    'BACKUP_EVIDENCE_SECRET_DETECTED',
  );
});
