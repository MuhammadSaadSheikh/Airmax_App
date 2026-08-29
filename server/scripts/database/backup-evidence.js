const { readFileSync, statSync } = require('node:fs');

const BACKUP_TYPES = new Set(['logical', 'physical', 'pitr', 'snapshot']);
const INTEGRITY_METHODS = new Set([
  'provider_status',
  'restore_rehearsal',
  'sha256',
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{2,199}$/;
const MAX_EVIDENCE_BYTES = 256 * 1024;

class BackupEvidenceError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'BackupEvidenceError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new BackupEvidenceError(code, message, details);
}

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} must be configured`);
  }
  return value.trim();
}

function identifier(value, field) {
  const normalized = requiredString(value, field);
  if (!IDENTIFIER_PATTERN.test(normalized)) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} contains unsupported characters`);
  }
  return normalized;
}

function integer(value, field, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    fail(
      'BACKUP_EVIDENCE_CONFIG_INVALID',
      `${field} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return parsed;
}

function timestamp(value, field) {
  const normalized = requiredString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(normalized)) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} must be an ISO UTC timestamp`);
  }
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime())) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} must be an ISO timestamp`);
  }
  return parsed;
}

function object(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} must be an object`);
  }
  return value;
}

function exactKeys(value, allowed, field) {
  const unexpected = Object.keys(value).filter(key => !allowed.includes(key));
  const missing = allowed.filter(key => !(key in value));
  if (unexpected.length || missing.length) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} fields are invalid`, {
      missing,
      unexpected,
    });
  }
}

function exactKeysWithOptional(value, required, optional, field) {
  const allowed = [...required, ...optional];
  const unexpected = Object.keys(value).filter(key => !allowed.includes(key));
  const missing = required.filter(key => !(key in value));
  if (unexpected.length || missing.length) {
    fail('BACKUP_EVIDENCE_INVALID', `${field} fields are invalid`, {
      missing,
      unexpected,
    });
  }
}

function normalizedHostname(hostname) {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
}

function isUnsafeProductionHostname(hostname) {
  const normalized = normalizedHostname(hostname);
  const ipv4 = normalized.split('.').map(Number);
  const privateIpv4 =
    ipv4.length === 4 &&
    ipv4.every(part => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (ipv4[0] === 10 ||
      (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
      (ipv4[0] === 192 && ipv4[1] === 168) ||
      (ipv4[0] === 169 && ipv4[1] === 254));
  const privateIpv6 =
    normalized.includes(':') &&
    (normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:'));
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized === 'host.docker.internal' ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized) ||
    privateIpv4 ||
    privateIpv6
  );
}

function rejectSecretMaterial(value, field = 'evidence') {
  if (typeof value === 'string') {
    const secretPatterns = [
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
      /\b(?:password|secret|token|credential|private[_-]?key)\s*[:=]/i,
      /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@/i,
    ];
    if (secretPatterns.some(pattern => pattern.test(value))) {
      fail(
        'BACKUP_EVIDENCE_SECRET_DETECTED',
        `${field} must not contain credentials or secret material`,
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectSecretMaterial(item, `${field}[${index}]`),
    );
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (
        /password|secret|token|credential|private.?key|database.?url|connection.?string/i.test(
          key,
        )
      ) {
        fail(
          'BACKUP_EVIDENCE_SECRET_DETECTED',
          `${field} must not contain credential fields`,
        );
      }
      rejectSecretMaterial(item, `${field}.${key}`);
    }
  }
}

function loadBackupEvidenceConfig(environment) {
  if (requiredString(environment.NODE_ENV, 'NODE_ENV') !== 'production') {
    fail('BACKUP_EVIDENCE_CONFIG_INVALID', 'NODE_ENV must be production');
  }
  const expectedHost = normalizedHostname(
    requiredString(
      environment.AIRMAX_DB_EXPECTED_HOST,
      'AIRMAX_DB_EXPECTED_HOST',
    ),
  );
  const expectedName = requiredString(
    environment.AIRMAX_DB_EXPECTED_NAME,
    'AIRMAX_DB_EXPECTED_NAME',
  );
  const expectedPort = String(
    integer(
      environment.AIRMAX_DB_EXPECTED_PORT ?? '5432',
      'AIRMAX_DB_EXPECTED_PORT',
      1,
      65535,
    ),
  );
  if (isUnsafeProductionHostname(expectedHost)) {
    fail(
      'BACKUP_EVIDENCE_CONFIG_INVALID',
      'AIRMAX_DB_EXPECTED_HOST cannot be local or private in production',
    );
  }
  return {
    expectedBackupReference: identifier(
      environment.AIRMAX_DB_BACKUP_REFERENCE,
      'AIRMAX_DB_BACKUP_REFERENCE',
    ),
    maxAgeMinutes: integer(
      environment.AIRMAX_BACKUP_MAX_AGE_MINUTES,
      'AIRMAX_BACKUP_MAX_AGE_MINUTES',
      1,
      10_080,
    ),
    minimumRetentionHours: integer(
      environment.AIRMAX_BACKUP_MIN_RETENTION_HOURS,
      'AIRMAX_BACKUP_MIN_RETENTION_HOURS',
      1,
      8_760,
    ),
    restoreTestMaxAgeDays: integer(
      environment.AIRMAX_RESTORE_TEST_MAX_AGE_DAYS,
      'AIRMAX_RESTORE_TEST_MAX_AGE_DAYS',
      1,
      365,
    ),
    target: {
      databaseName: expectedName,
      host: expectedHost,
      port: expectedPort,
    },
  };
}

function validateBackupEvidence(evidenceInput, config, nowInput = new Date()) {
  const evidence = object(evidenceInput, 'evidence');
  rejectSecretMaterial(evidence);
  exactKeys(
    evidence,
    [
      'schemaVersion',
      'evidenceId',
      'backupId',
      'backupType',
      'status',
      'environment',
      'target',
      'startedAt',
      'recoveryPointAt',
      'completedAt',
      'expiresAt',
      'security',
      'integrity',
      'restoreTest',
    ],
    'evidence',
  );
  if (evidence.schemaVersion !== 1) {
    fail('BACKUP_EVIDENCE_INVALID', 'schemaVersion must be 1');
  }
  const evidenceId = identifier(evidence.evidenceId, 'evidenceId');
  const backupId = identifier(evidence.backupId, 'backupId');
  if (backupId !== config.expectedBackupReference) {
    fail(
      'BACKUP_EVIDENCE_TARGET_MISMATCH',
      'backupId does not match AIRMAX_DB_BACKUP_REFERENCE',
    );
  }
  if (!BACKUP_TYPES.has(evidence.backupType)) {
    fail('BACKUP_EVIDENCE_INVALID', 'backupType is unsupported');
  }
  if (evidence.status !== 'COMPLETED') {
    fail('BACKUP_EVIDENCE_INCOMPLETE', 'backup status must be COMPLETED');
  }
  if (evidence.environment !== 'production') {
    fail(
      'BACKUP_EVIDENCE_TARGET_MISMATCH',
      'backup environment must be production',
    );
  }

  const target = object(evidence.target, 'target');
  exactKeys(target, ['host', 'port', 'databaseName'], 'target');
  const actualTarget = {
    databaseName: requiredString(target.databaseName, 'target.databaseName'),
    host: normalizedHostname(requiredString(target.host, 'target.host')),
    port: String(integer(target.port, 'target.port', 1, 65535)),
  };
  if (
    actualTarget.host !== config.target.host ||
    actualTarget.port !== config.target.port ||
    actualTarget.databaseName !== config.target.databaseName
  ) {
    fail(
      'BACKUP_EVIDENCE_TARGET_MISMATCH',
      'backup target does not match the approved database target',
    );
  }

  const now = new Date(nowInput);
  if (!Number.isFinite(now.getTime())) {
    fail('BACKUP_EVIDENCE_CONFIG_INVALID', 'validation time is invalid');
  }
  const startedAt = timestamp(evidence.startedAt, 'startedAt');
  const recoveryPointAt = timestamp(
    evidence.recoveryPointAt,
    'recoveryPointAt',
  );
  const completedAt = timestamp(evidence.completedAt, 'completedAt');
  const expiresAt = timestamp(evidence.expiresAt, 'expiresAt');
  if (
    startedAt > recoveryPointAt ||
    recoveryPointAt > completedAt ||
    completedAt > now
  ) {
    fail(
      'BACKUP_EVIDENCE_INVALID',
      'backup timestamps are not in a valid chronological order',
    );
  }
  const ageMinutes = (now - recoveryPointAt) / 60_000;
  if (ageMinutes > config.maxAgeMinutes) {
    fail(
      'BACKUP_EVIDENCE_STALE',
      'backup recovery point exceeds the approved maximum age',
      { ageMinutes: Math.floor(ageMinutes) },
    );
  }
  const minimumExpiry = new Date(
    now.getTime() + config.minimumRetentionHours * 60 * 60_000,
  );
  if (expiresAt < minimumExpiry) {
    fail(
      'BACKUP_EVIDENCE_RETENTION_FAILED',
      'backup expiry does not meet minimum retention',
    );
  }

  const security = object(evidence.security, 'security');
  exactKeys(
    security,
    [
      'encryptedAtRest',
      'encryptedInTransit',
      'accessControlled',
      'immutableUntil',
    ],
    'security',
  );
  if (
    security.encryptedAtRest !== true ||
    security.encryptedInTransit !== true ||
    security.accessControlled !== true
  ) {
    fail(
      'BACKUP_EVIDENCE_SECURITY_FAILED',
      'backup encryption and access-control evidence must be true',
    );
  }
  const immutableUntil = timestamp(
    security.immutableUntil,
    'security.immutableUntil',
  );
  if (immutableUntil < minimumExpiry) {
    fail(
      'BACKUP_EVIDENCE_RETENTION_FAILED',
      'backup immutability does not meet minimum retention',
    );
  }

  const integrity = object(evidence.integrity, 'integrity');
  exactKeysWithOptional(
    integrity,
    ['method', 'verifiedAt', 'verifiedBy'],
    ['digest'],
    'integrity',
  );
  if (!INTEGRITY_METHODS.has(integrity.method)) {
    fail('BACKUP_EVIDENCE_INVALID', 'integrity.method is unsupported');
  }
  const integrityVerifiedAt = timestamp(
    integrity.verifiedAt,
    'integrity.verifiedAt',
  );
  if (integrityVerifiedAt < completedAt || integrityVerifiedAt > now) {
    fail('BACKUP_EVIDENCE_INVALID', 'integrity verification time is invalid');
  }
  identifier(integrity.verifiedBy, 'integrity.verifiedBy');
  if (evidence.backupType === 'logical' && integrity.method !== 'sha256') {
    fail(
      'BACKUP_EVIDENCE_INTEGRITY_FAILED',
      'logical backups require SHA-256 integrity evidence',
    );
  }
  if (
    integrity.method === 'sha256' &&
    !/^[0-9a-f]{64}$/i.test(integrity.digest ?? '')
  ) {
    fail(
      'BACKUP_EVIDENCE_INTEGRITY_FAILED',
      'SHA-256 integrity evidence requires a valid digest',
    );
  }
  if (integrity.method !== 'sha256' && 'digest' in integrity) {
    fail(
      'BACKUP_EVIDENCE_INVALID',
      'digest is only allowed for SHA-256 integrity evidence',
    );
  }

  const restoreTest = object(evidence.restoreTest, 'restoreTest');
  exactKeys(
    restoreTest,
    ['evidenceId', 'status', 'completedAt', 'verifiedBy'],
    'restoreTest',
  );
  const restoreTestEvidenceId = identifier(
    restoreTest.evidenceId,
    'restoreTest.evidenceId',
  );
  if (restoreTest.status !== 'PASSED') {
    fail(
      'BACKUP_EVIDENCE_RESTORE_TEST_FAILED',
      'restore rehearsal status must be PASSED',
    );
  }
  const restoreTestCompletedAt = timestamp(
    restoreTest.completedAt,
    'restoreTest.completedAt',
  );
  if (restoreTestCompletedAt > now) {
    fail(
      'BACKUP_EVIDENCE_RESTORE_TEST_FAILED',
      'restore rehearsal completion time cannot be in the future',
    );
  }
  const restoreTestAgeDays =
    (now - restoreTestCompletedAt) / (24 * 60 * 60_000);
  if (restoreTestAgeDays > config.restoreTestMaxAgeDays) {
    fail(
      'BACKUP_EVIDENCE_RESTORE_TEST_FAILED',
      'restore rehearsal evidence is older than the approved maximum age',
    );
  }
  identifier(restoreTest.verifiedBy, 'restoreTest.verifiedBy');

  return {
    backupId,
    backupType: evidence.backupType,
    completedAt: completedAt.toISOString(),
    evidenceId,
    expiresAt: expiresAt.toISOString(),
    immutableUntil: immutableUntil.toISOString(),
    outcome: 'passed',
    recoveryPointAt: recoveryPointAt.toISOString(),
    restoreTest: {
      completedAt: restoreTestCompletedAt.toISOString(),
      evidenceId: restoreTestEvidenceId,
      status: 'PASSED',
    },
    target: config.target,
  };
}

function validateBackupEvidenceFile(file, environment, now = new Date()) {
  const evidenceFile = requiredString(file, 'backup evidence file');
  const config = loadBackupEvidenceConfig(environment);
  let evidence;
  try {
    const metadata = statSync(evidenceFile);
    if (!metadata.isFile() || metadata.size > MAX_EVIDENCE_BYTES) {
      fail(
        'BACKUP_EVIDENCE_INVALID',
        'backup evidence file must be a regular JSON file no larger than 256 KiB',
      );
    }
    evidence = JSON.parse(readFileSync(evidenceFile, 'utf8'));
  } catch (error) {
    if (error instanceof BackupEvidenceError) throw error;
    if (error instanceof SyntaxError) {
      fail(
        'BACKUP_EVIDENCE_INVALID',
        'backup evidence file must contain valid JSON',
      );
    }
    fail('BACKUP_EVIDENCE_UNAVAILABLE', 'backup evidence file is unavailable');
  }
  return validateBackupEvidence(evidence, config, now);
}

module.exports = {
  BackupEvidenceError,
  loadBackupEvidenceConfig,
  rejectSecretMaterial,
  validateBackupEvidence,
  validateBackupEvidenceFile,
};
