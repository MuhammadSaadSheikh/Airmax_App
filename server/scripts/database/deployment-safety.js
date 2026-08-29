const { createHash } = require('node:crypto');
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { resolve } = require('node:path');

const SERVER_ROOT = resolve(__dirname, '../..');
const DEFAULT_MIGRATIONS_DIR = resolve(SERVER_ROOT, 'prisma/migrations');

const REQUIRED_TABLES = [
  'AuditLog',
  'Complaint',
  'ComplaintHistory',
  'Customer',
  'Invoice',
  'InvoiceEvent',
  'Notification',
  'Package',
  'Payment',
  'PaymentAttempt',
  'RefreshToken',
  'ServiceArea',
  'Skill',
  'Subscription',
  'SubscriptionHistory',
  'Technician',
  'TechnicianAssignment',
  'TechnicianSkill',
  'User',
  'WorkOrder',
  'WorkOrderHistory',
];

const REQUIRED_ENUMS = [
  'BillingPeriod',
  'ComplaintHistoryType',
  'ComplaintPriority',
  'ComplaintStatus',
  'CustomerStatus',
  'InvoiceEventType',
  'InvoiceStatus',
  'PackageStatus',
  'PaymentAttemptStatus',
  'PaymentStatus',
  'Role',
  'SubscriptionHistoryType',
  'SubscriptionStatus',
  'TechnicianAssignmentStatus',
  'TechnicianStatus',
  'UserStatus',
  'WorkOrderHistoryType',
  'WorkOrderStatus',
];

const REQUIRED_COLUMNS = {
  Complaint: ['customerId'],
  Customer: ['userId'],
  Invoice: ['customerId', 'subscriptionId'],
  Payment: ['customerId', 'invoiceId'],
  Subscription: ['customerId', 'packageId'],
  WorkOrder: ['assignmentId', 'complaintId', 'customerId', 'technicianId'],
};

const FORBIDDEN_OWNERSHIP_COLUMNS = {
  Complaint: ['userId'],
  Invoice: ['userId'],
  Payment: ['userId'],
  Subscription: ['userId'],
};

const REQUIRED_FOREIGN_KEYS = [
  ['Customer', 'userId', 'User', 'id'],
  ['Subscription', 'customerId', 'Customer', 'id'],
  ['Subscription', 'packageId', 'Package', 'id'],
  ['Invoice', 'customerId', 'Customer', 'id'],
  ['Invoice', 'subscriptionId', 'Subscription', 'id'],
  ['Payment', 'customerId', 'Customer', 'id'],
  ['Payment', 'invoiceId', 'Invoice', 'id'],
  ['Complaint', 'customerId', 'Customer', 'id'],
  ['WorkOrder', 'complaintId', 'Complaint', 'id'],
  ['WorkOrder', 'customerId', 'Customer', 'id'],
  ['WorkOrder', 'technicianId', 'Technician', 'id'],
  ['WorkOrder', 'assignmentId', 'TechnicianAssignment', 'id'],
];

const OWNERSHIP_CHECKS = [
  'customer_user_role',
  'invoice_subscription_customer',
  'payment_invoice_customer',
  'work_order_assignment_complaint',
  'work_order_assignment_technician',
  'work_order_complaint_customer',
];

class DeploymentSafetyError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'DeploymentSafetyError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new DeploymentSafetyError(code, message, details);
}

function requiredEnvironment(environment, key) {
  const value = environment[key]?.trim();
  if (!value) fail('ENVIRONMENT_INVALID', `${key} must be configured`);
  return value;
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

function loadDeploymentConfig(environment, options = {}) {
  const requireApprovals = options.requireApprovals !== false;
  if (requiredEnvironment(environment, 'NODE_ENV') !== 'production') {
    fail('ENVIRONMENT_INVALID', 'NODE_ENV must be production');
  }

  const rawDatabaseUrl = requiredEnvironment(environment, 'DATABASE_URL');
  let databaseUrl;
  try {
    databaseUrl = new URL(rawDatabaseUrl);
  } catch {
    fail('DATABASE_URL_INVALID', 'DATABASE_URL must be a valid absolute URL');
  }
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    fail('DATABASE_URL_INVALID', 'DATABASE_URL must use PostgreSQL');
  }
  if (isUnsafeProductionHostname(databaseUrl.hostname)) {
    fail(
      'DATABASE_TARGET_UNSAFE',
      'DATABASE_URL cannot target a local or private development host',
    );
  }
  const sslMode = databaseUrl.searchParams.get('sslmode');
  if (!['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')) {
    fail(
      'DATABASE_TLS_REQUIRED',
      'DATABASE_URL must use sslmode=require, verify-ca, or verify-full',
    );
  }

  const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
  if (!databaseName || databaseName.includes('/')) {
    fail('DATABASE_URL_INVALID', 'DATABASE_URL must include one database name');
  }
  const host = normalizedHostname(databaseUrl.hostname);
  const port = databaseUrl.port || '5432';
  const expectedHost = normalizedHostname(
    requiredEnvironment(environment, 'AIRMAX_DB_EXPECTED_HOST'),
  );
  const expectedName = requiredEnvironment(
    environment,
    'AIRMAX_DB_EXPECTED_NAME',
  );
  const expectedPort = environment.AIRMAX_DB_EXPECTED_PORT?.trim() || '5432';
  if (
    host !== expectedHost ||
    databaseName !== expectedName ||
    port !== expectedPort
  ) {
    fail(
      'DATABASE_TARGET_MISMATCH',
      'Database target does not match approval',
      {
        actual: { databaseName, host, port },
        expected: {
          databaseName: expectedName,
          host: expectedHost,
          port: expectedPort,
        },
      },
    );
  }

  const deploymentMode = requiredEnvironment(
    environment,
    'AIRMAX_DB_DEPLOY_MODE',
  );
  if (!['greenfield', 'tracked'].includes(deploymentMode)) {
    fail(
      'ENVIRONMENT_INVALID',
      'AIRMAX_DB_DEPLOY_MODE must be greenfield or tracked',
    );
  }

  const releaseSha = requiredEnvironment(environment, 'AIRMAX_RELEASE_SHA');
  if (!/^[0-9a-f]{7,64}$/i.test(releaseSha)) {
    fail('ENVIRONMENT_INVALID', 'AIRMAX_RELEASE_SHA must be a Git commit SHA');
  }

  let healthBaseUrl;
  if (environment.AIRMAX_HEALTH_BASE_URL?.trim()) {
    try {
      const healthUrl = new URL(environment.AIRMAX_HEALTH_BASE_URL.trim());
      if (
        healthUrl.protocol !== 'https:' ||
        healthUrl.username ||
        healthUrl.password ||
        healthUrl.pathname !== '/' ||
        healthUrl.search ||
        healthUrl.hash
      ) {
        throw new Error('not an HTTPS origin');
      }
      healthBaseUrl = healthUrl.origin;
    } catch {
      fail(
        'ENVIRONMENT_INVALID',
        'AIRMAX_HEALTH_BASE_URL must be an HTTPS origin',
      );
    }
  }

  let approvals;
  if (requireApprovals) {
    if (
      requiredEnvironment(environment, 'AIRMAX_DB_DEPLOY_APPROVAL') !==
      'APPROVED'
    ) {
      fail('APPROVAL_REQUIRED', 'AIRMAX_DB_DEPLOY_APPROVAL must be APPROVED');
    }
    if (
      requiredEnvironment(environment, 'AIRMAX_DB_MAINTENANCE_APPROVAL') !==
      'APPROVED'
    ) {
      fail(
        'APPROVAL_REQUIRED',
        'AIRMAX_DB_MAINTENANCE_APPROVAL must be APPROVED',
      );
    }
    const backupReference = requiredEnvironment(
      environment,
      'AIRMAX_DB_BACKUP_REFERENCE',
    );
    if (!/^[A-Za-z0-9._:/-]{3,200}$/.test(backupReference)) {
      fail(
        'APPROVAL_REQUIRED',
        'AIRMAX_DB_BACKUP_REFERENCE contains unsupported characters',
      );
    }
    approvals = {
      backupReference,
      deployment: 'APPROVED',
      maintenance: 'APPROVED',
    };
  }

  return {
    approvals,
    databaseUrl: rawDatabaseUrl,
    deploymentMode,
    healthBaseUrl,
    migrationsDir:
      environment.AIRMAX_MIGRATIONS_DIR?.trim() || DEFAULT_MIGRATIONS_DIR,
    releaseSha: releaseSha.toLowerCase(),
    reportDir:
      environment.AIRMAX_DB_REPORT_DIR?.trim() ||
      resolve(SERVER_ROOT, 'artifacts/database-deployment'),
    target: {
      databaseName,
      host,
      port,
      sslMode,
    },
  };
}

function inventoryMigrations(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  if (!existsSync(migrationsDir)) {
    fail('MIGRATION_DIRECTORY_INVALID', 'Migration directory does not exist');
  }
  const directories = readdirSync(migrationsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  const invalid = directories.filter(
    name => !/^\d{14}_[a-z0-9][a-z0-9_]*$/.test(name),
  );
  if (invalid.length) {
    fail('MIGRATION_DIRECTORY_INVALID', 'Invalid migration directory name', {
      invalid,
    });
  }
  const names = [...directories].sort();
  if (!names.length) {
    fail('MIGRATION_DIRECTORY_INVALID', 'Migration directory is empty');
  }
  if (new Set(names).size !== names.length) {
    fail('MIGRATION_DIRECTORY_INVALID', 'Duplicate migration name detected');
  }
  for (let index = 1; index < names.length; index += 1) {
    if (names[index].slice(0, 14) <= names[index - 1].slice(0, 14)) {
      fail(
        'MIGRATION_ORDER_INVALID',
        'Migration timestamps must increase strictly',
      );
    }
  }
  const lockFile = resolve(migrationsDir, 'migration_lock.toml');
  if (
    !existsSync(lockFile) ||
    !/provider\s*=\s*"postgresql"/.test(readFileSync(lockFile, 'utf8'))
  ) {
    fail(
      'MIGRATION_DIRECTORY_INVALID',
      'migration_lock.toml must specify PostgreSQL',
    );
  }
  return names.map(name => {
    const sqlPath = resolve(migrationsDir, name, 'migration.sql');
    if (!existsSync(sqlPath)) {
      fail('MIGRATION_DIRECTORY_INVALID', `${name} has no migration.sql`);
    }
    const sql = readFileSync(sqlPath);
    if (!sql.length) {
      fail('MIGRATION_DIRECTORY_INVALID', `${name}/migration.sql is empty`);
    }
    return {
      checksum: createHash('sha256').update(sql).digest('hex'),
      name,
    };
  });
}

function classifyTarget(databaseState) {
  if (databaseState.migrationTableExists) return 'tracked';
  if (
    databaseState.publicTables.length === 0 &&
    databaseState.publicEnums.length === 0
  ) {
    return 'greenfield';
  }
  return 'unsupported';
}

function compareExactSet(actual, expected, code, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter(value => !actualSet.has(value));
  const unexpected = actual.filter(value => !expectedSet.has(value));
  if (missing.length || unexpected.length) {
    fail(code, `${label} do not match the AIRMAX production schema`, {
      missing,
      unexpected,
    });
  }
}

function validateMigrationHistory(localMigrations, databaseState) {
  const records = databaseState.migrations ?? [];
  const rolledBack = records.filter(record => record.rolledBackAt);
  if (rolledBack.length) {
    fail('MIGRATION_HISTORY_INVALID', 'Rolled-back migrations require review', {
      migrations: rolledBack.map(record => record.name),
    });
  }
  const unfinished = records.filter(record => !record.finishedAt);
  if (unfinished.length) {
    fail('FAILED_MIGRATION', 'Failed or unfinished migration detected', {
      migrations: unfinished.map(record => record.name),
    });
  }
  const applied = records.map(record => record.name);
  if (new Set(applied).size !== applied.length) {
    fail('MIGRATION_HISTORY_INVALID', 'Duplicate applied migration detected');
  }
  const localByName = new Map(
    localMigrations.map(migration => [migration.name, migration]),
  );
  const unknown = applied.filter(name => !localByName.has(name));
  if (unknown.length) {
    fail('MIGRATION_HISTORY_INVALID', 'Unknown applied migration detected', {
      unknown,
    });
  }
  for (const record of records) {
    if (localByName.get(record.name).checksum !== record.checksum) {
      fail('MIGRATION_CHECKSUM_MISMATCH', 'Migration checksum mismatch', {
        migration: record.name,
      });
    }
  }
  const expectedPrefix = localMigrations
    .slice(0, applied.length)
    .map(migration => migration.name);
  if (applied.some((name, index) => name !== expectedPrefix[index])) {
    fail(
      'MIGRATION_ORDER_INVALID',
      'Applied migrations do not form a valid local prefix',
      { applied, expectedPrefix },
    );
  }
  return {
    applied,
    pending: localMigrations
      .slice(applied.length)
      .map(migration => migration.name),
  };
}

function assertTrackedSchemaShape(databaseState) {
  compareExactSet(
    databaseState.publicTables,
    REQUIRED_TABLES,
    'SCHEMA_COMPATIBILITY_FAILED',
    'Database tables',
  );
  compareExactSet(
    databaseState.publicEnums,
    REQUIRED_ENUMS,
    'SCHEMA_COMPATIBILITY_FAILED',
    'Database enums',
  );
}

function assertTargetIdentity(config, identity) {
  if (identity.databaseName !== config.target.databaseName) {
    fail('DATABASE_TARGET_MISMATCH', 'Connected database name is unexpected', {
      actual: identity.databaseName,
      expected: config.target.databaseName,
    });
  }
  if (identity.inRecovery || identity.transactionReadOnly) {
    fail(
      'DATABASE_TARGET_READ_ONLY',
      'Migration target is read-only or in recovery',
    );
  }
  if (!identity.canCreateInPublicSchema) {
    fail(
      'DATABASE_PERMISSION_DENIED',
      'Migration role cannot create objects in the public schema',
    );
  }
}

function assertReleaseState(config, releaseState) {
  if (!releaseState?.available) return;
  if (releaseState.sha.toLowerCase() !== config.releaseSha) {
    fail(
      'RELEASE_MISMATCH',
      'AIRMAX_RELEASE_SHA does not match repository HEAD',
    );
  }
  if (!releaseState.clean) {
    fail('RELEASE_DIRTY', 'Database deployment requires a clean release tree');
  }
}

function sanitizedCommandResult(result, config) {
  return {
    exitCode: result.exitCode,
    stderr: sanitizeText(result.stderr, config.databaseUrl),
    stdout: sanitizeText(result.stdout, config.databaseUrl),
  };
}

function sanitizeText(value, databaseUrl) {
  let result = String(value ?? '');
  if (databaseUrl)
    result = result.split(databaseUrl).join('[REDACTED_DATABASE_URL]');
  try {
    const parsed = new URL(databaseUrl);
    for (const secret of [
      parsed.username,
      decodeURIComponent(parsed.username || ''),
      parsed.password,
      decodeURIComponent(parsed.password || ''),
    ]) {
      if (secret) result = result.split(secret).join('[REDACTED]');
    }
  } catch {
    // The configuration validator reports invalid URLs before sanitization.
  }
  return result.replace(
    /\b(postgres(?:ql)?:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi,
    '$1[REDACTED]@',
  );
}

async function runPreflight(options) {
  const config = loadDeploymentConfig(options.environment);
  const migrations = inventoryMigrations(config.migrationsDir);
  const validation = sanitizedCommandResult(
    await options.processAdapter.prismaValidate(),
    config,
  );
  if (validation.exitCode !== 0) {
    fail('PRISMA_VALIDATION_FAILED', 'Prisma schema validation failed', {
      validation,
    });
  }
  assertReleaseState(config, await options.processAdapter.releaseState());

  const identity = await options.database.inspectIdentity();
  assertTargetIdentity(config, identity);
  const databaseState = await options.database.inspectState();
  const classification = classifyTarget(databaseState);
  if (classification === 'unsupported') {
    fail(
      'UNSUPPORTED_DATABASE',
      'Database contains untracked objects and requires cutover reconciliation',
      {
        publicEnums: databaseState.publicEnums,
        publicTables: databaseState.publicTables,
      },
    );
  }
  if (classification !== config.deploymentMode) {
    fail('DATABASE_MODE_MISMATCH', 'Database classification is unexpected', {
      actual: classification,
      expected: config.deploymentMode,
    });
  }
  if (classification === 'tracked') assertTrackedSchemaShape(databaseState);
  const migrationState = validateMigrationHistory(migrations, databaseState);

  return {
    approvals: config.approvals,
    classification,
    identity: {
      databaseName: identity.databaseName,
      postgresVersion: identity.postgresVersion,
    },
    migrations: {
      applied: migrationState.applied,
      checksums: migrations.map(migration => ({ ...migration })),
      pending: migrationState.pending,
    },
    outcome: 'passed',
    phase: 'preflight',
    releaseSha: config.releaseSha,
    target: config.target,
    validation: { prisma: 'passed' },
  };
}

function foreignKeyKey(parts) {
  return parts.join('.');
}

function assertSchemaVerification(schemaState) {
  compareExactSet(
    schemaState.tables,
    REQUIRED_TABLES,
    'POSTFLIGHT_SCHEMA_FAILED',
    'Database tables',
  );
  compareExactSet(
    schemaState.enums,
    REQUIRED_ENUMS,
    'POSTFLIGHT_SCHEMA_FAILED',
    'Database enums',
  );

  const columns = new Map(
    schemaState.columns.map(item => [item.table, new Set(item.columns)]),
  );
  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    const actual = columns.get(table) ?? new Set();
    const missing = required.filter(column => !actual.has(column));
    if (missing.length) {
      fail(
        'POSTFLIGHT_SCHEMA_FAILED',
        `Required columns missing from ${table}`,
        {
          missing,
        },
      );
    }
  }
  for (const [table, forbidden] of Object.entries(
    FORBIDDEN_OWNERSHIP_COLUMNS,
  )) {
    const actual = columns.get(table) ?? new Set();
    const present = forbidden.filter(column => actual.has(column));
    if (present.length) {
      fail(
        'POSTFLIGHT_OWNERSHIP_FAILED',
        `Legacy ownership columns remain on ${table}`,
        { present },
      );
    }
  }

  const actualForeignKeys = new Set(
    schemaState.foreignKeys.map(item =>
      foreignKeyKey([
        item.table,
        item.column,
        item.foreignTable,
        item.foreignColumn,
      ]),
    ),
  );
  const missingForeignKeys = REQUIRED_FOREIGN_KEYS.filter(
    item => !actualForeignKeys.has(foreignKeyKey(item)),
  );
  if (missingForeignKeys.length) {
    fail(
      'POSTFLIGHT_SCHEMA_FAILED',
      'Required ownership foreign keys are missing',
      { missingForeignKeys },
    );
  }

  const violations = new Map(
    schemaState.ownershipChecks.map(item => [
      item.check,
      Number(item.violationCount),
    ]),
  );
  const missingChecks = OWNERSHIP_CHECKS.filter(
    check => !violations.has(check),
  );
  const failedChecks = [...violations].filter(([, count]) => count !== 0);
  if (missingChecks.length || failedChecks.length) {
    fail(
      'POSTFLIGHT_OWNERSHIP_FAILED',
      'Ownership relationship validation failed',
      { failedChecks, missingChecks },
    );
  }
}

async function runVerify(options, existingConfig) {
  const config =
    existingConfig ??
    loadDeploymentConfig(options.environment, { requireApprovals: false });
  const migrations = inventoryMigrations(config.migrationsDir);
  const identity = await options.database.inspectIdentity();
  assertTargetIdentity(config, identity);
  const databaseState = await options.database.inspectState();
  if (classifyTarget(databaseState) !== 'tracked') {
    fail('POSTFLIGHT_MIGRATION_FAILED', 'Database is not Prisma tracked');
  }
  assertTrackedSchemaShape(databaseState);
  const migrationState = validateMigrationHistory(migrations, databaseState);
  if (migrationState.pending.length) {
    fail('POSTFLIGHT_MIGRATION_FAILED', 'Pending migrations remain', {
      pending: migrationState.pending,
    });
  }

  const status = sanitizedCommandResult(
    await options.processAdapter.prismaStatus(),
    config,
  );
  if (status.exitCode !== 0) {
    fail(
      'POSTFLIGHT_MIGRATION_FAILED',
      'Prisma migration status is not clean',
      {
        status,
      },
    );
  }
  const schemaState = await options.database.inspectSchemaCompatibility();
  assertSchemaVerification(schemaState);
  const health = await options.processAdapter.healthCheck(config.healthBaseUrl);
  if (health.status === 'failed') {
    fail('POSTFLIGHT_HEALTH_FAILED', 'Application health validation failed', {
      health,
    });
  }

  return {
    health,
    migrations: { applied: migrationState.applied, pending: [] },
    outcome: 'passed',
    ownershipChecks: 'passed',
    phase: 'verify',
    releaseSha: config.releaseSha,
    schemaCompatibility: 'passed',
    target: config.target,
  };
}

async function runSafeDeploy(options) {
  const config = loadDeploymentConfig(options.environment);
  const preflight = await runPreflight(options);
  const deploy = sanitizedCommandResult(
    await options.processAdapter.prismaDeploy(),
    config,
  );
  if (deploy.exitCode !== 0) {
    fail(
      'MIGRATION_DEPLOY_FAILED',
      'prisma migrate deploy failed; automatic retry and repair are disabled',
      { deploy, preflight },
    );
  }
  const verification = await runVerify(options, config);
  return {
    deploy: { exitCode: deploy.exitCode, status: 'passed' },
    outcome: 'passed',
    phase: 'safe-deploy',
    preflight,
    releaseSha: config.releaseSha,
    target: config.target,
    verification,
  };
}

module.exports = {
  DEFAULT_MIGRATIONS_DIR,
  DeploymentSafetyError,
  FORBIDDEN_OWNERSHIP_COLUMNS,
  OWNERSHIP_CHECKS,
  REQUIRED_COLUMNS,
  REQUIRED_ENUMS,
  REQUIRED_FOREIGN_KEYS,
  REQUIRED_TABLES,
  assertSchemaVerification,
  classifyTarget,
  inventoryMigrations,
  loadDeploymentConfig,
  runPreflight,
  runSafeDeploy,
  runVerify,
  sanitizeText,
  validateMigrationHistory,
};
