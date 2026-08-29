const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  DEFAULT_MIGRATIONS_DIR,
  DeploymentSafetyError,
  OWNERSHIP_CHECKS,
  REQUIRED_COLUMNS,
  REQUIRED_ENUMS,
  REQUIRED_FOREIGN_KEYS,
  REQUIRED_TABLES,
  inventoryMigrations,
  loadDeploymentConfig,
  runPreflight,
  runSafeDeploy,
  runVerify,
  sanitizeText,
  validateMigrationHistory,
} = require('../scripts/database/deployment-safety');

const migrations = inventoryMigrations(DEFAULT_MIGRATIONS_DIR);

function environment(overrides = {}) {
  return {
    AIRMAX_DB_BACKUP_REFERENCE: 'backup-2026-08-30T10:00Z',
    AIRMAX_DB_DEPLOY_APPROVAL: 'APPROVED',
    AIRMAX_DB_DEPLOY_MODE: 'tracked',
    AIRMAX_DB_EXPECTED_HOST: 'db.airmax.example',
    AIRMAX_DB_EXPECTED_NAME: 'airmax',
    AIRMAX_DB_MAINTENANCE_APPROVAL: 'APPROVED',
    AIRMAX_RELEASE_SHA: 'a'.repeat(40),
    DATABASE_URL:
      'postgresql://airmax_migrator:never-log-this@db.airmax.example:5432/airmax?sslmode=verify-full',
    NODE_ENV: 'production',
    ...overrides,
  };
}

function migrationRecords(applied = migrations) {
  return applied.map((migration, index) => ({
    checksum: migration.checksum,
    finishedAt: new Date(index + 1),
    name: migration.name,
    rolledBackAt: null,
    startedAt: new Date(index),
  }));
}

function trackedState(applied = migrations) {
  return {
    migrationTableExists: true,
    migrations: migrationRecords(applied),
    publicEnums: [...REQUIRED_ENUMS],
    publicTables: [...REQUIRED_TABLES],
  };
}

function greenfieldState() {
  return {
    migrationTableExists: false,
    migrations: [],
    publicEnums: [],
    publicTables: [],
  };
}

function compatibleSchema(overrides = {}) {
  return {
    columns: Object.entries(REQUIRED_COLUMNS).map(([table, columns]) => ({
      columns: [...columns],
      table,
    })),
    enums: [...REQUIRED_ENUMS],
    foreignKeys: REQUIRED_FOREIGN_KEYS.map(
      ([table, column, foreignTable, foreignColumn]) => ({
        column,
        foreignColumn,
        foreignTable,
        table,
      }),
    ),
    ownershipChecks: OWNERSHIP_CHECKS.map(check => ({
      check,
      violationCount: '0',
    })),
    tables: [...REQUIRED_TABLES],
    ...overrides,
  };
}

function databaseAdapter(states = [trackedState()], overrides = {}) {
  let stateIndex = 0;
  return {
    async inspectIdentity() {
      return {
        canCreateInPublicSchema: true,
        databaseName: 'airmax',
        databaseUser: 'airmax_migrator',
        inRecovery: false,
        postgresVersion: '16.4',
        transactionReadOnly: false,
      };
    },
    async inspectSchemaCompatibility() {
      return compatibleSchema();
    },
    async inspectState() {
      const state = states[Math.min(stateIndex, states.length - 1)];
      stateIndex += 1;
      return state;
    },
    ...overrides,
  };
}

function processAdapter(overrides = {}) {
  return {
    async healthCheck() {
      return { status: 'skipped' };
    },
    async prismaDeploy() {
      return { exitCode: 0, stderr: '', stdout: 'migrated' };
    },
    async prismaStatus() {
      return { exitCode: 0, stderr: '', stdout: 'up to date' };
    },
    async prismaValidate() {
      return { exitCode: 0, stderr: '', stdout: 'valid' };
    },
    async releaseState() {
      return { available: false };
    },
    ...overrides,
  };
}

function expectSafetyCode(action, code) {
  assert.throws(action, error => {
    assert.ok(error instanceof DeploymentSafetyError);
    assert.equal(error.code, code);
    return true;
  });
}

test('configuration fails closed for environment, target, TLS, and approvals', () => {
  expectSafetyCode(
    () => loadDeploymentConfig(environment({ NODE_ENV: 'development' })),
    'ENVIRONMENT_INVALID',
  );
  expectSafetyCode(
    () =>
      loadDeploymentConfig(
        environment({
          AIRMAX_DB_EXPECTED_HOST: 'localhost',
          DATABASE_URL:
            'postgresql://airmax:secret@localhost:5432/airmax?sslmode=require',
        }),
      ),
    'DATABASE_TARGET_UNSAFE',
  );
  expectSafetyCode(
    () =>
      loadDeploymentConfig(
        environment({
          DATABASE_URL:
            'mysql://airmax:secret@db.airmax.example:5432/airmax?sslmode=verify-full',
        }),
      ),
    'DATABASE_URL_INVALID',
  );
  expectSafetyCode(
    () =>
      loadDeploymentConfig(
        environment({
          DATABASE_URL:
            'postgresql://airmax:secret@db.airmax.example:5432/airmax',
        }),
      ),
    'DATABASE_TLS_REQUIRED',
  );
  expectSafetyCode(
    () =>
      loadDeploymentConfig(
        environment({ AIRMAX_DB_EXPECTED_NAME: 'another_database' }),
      ),
    'DATABASE_TARGET_MISMATCH',
  );
  expectSafetyCode(
    () =>
      loadDeploymentConfig(
        environment({ AIRMAX_DB_DEPLOY_APPROVAL: 'PENDING' }),
      ),
    'APPROVAL_REQUIRED',
  );
  expectSafetyCode(
    () =>
      loadDeploymentConfig(
        environment({
          AIRMAX_HEALTH_BASE_URL: 'http://api.airmax.example/api',
        }),
      ),
    'ENVIRONMENT_INVALID',
  );
});

test('credential sanitizer removes full URLs, usernames, and passwords', () => {
  const databaseUrl = environment().DATABASE_URL;
  const sanitized = sanitizeText(
    `failed ${databaseUrl} postgresql://airmax_migrator:never-log-this@db.airmax.example/airmax never-log-this`,
    databaseUrl,
  );
  assert.doesNotMatch(sanitized, /airmax_migrator|never-log-this/);
  assert.match(sanitized, /REDACTED/);
});

test('migration inventory is ordered and includes deterministic checksums', () => {
  assert.ok(migrations.length >= 3);
  assert.deepEqual(
    migrations.map(migration => migration.name),
    [...migrations].map(migration => migration.name).sort(),
  );
  for (const migration of migrations) {
    assert.match(migration.name, /^\d{14}_[a-z0-9][a-z0-9_]*$/);
    assert.match(migration.checksum, /^[0-9a-f]{64}$/);
  }
});

test('migration history detects failures, checksum changes, and invalid order', () => {
  const failed = trackedState();
  failed.migrations[0].finishedAt = null;
  expectSafetyCode(
    () => validateMigrationHistory(migrations, failed),
    'FAILED_MIGRATION',
  );

  const changed = trackedState();
  changed.migrations[0].checksum = '0'.repeat(64);
  expectSafetyCode(
    () => validateMigrationHistory(migrations, changed),
    'MIGRATION_CHECKSUM_MISMATCH',
  );

  const reordered = trackedState();
  [reordered.migrations[0], reordered.migrations[1]] = [
    reordered.migrations[1],
    reordered.migrations[0],
  ];
  expectSafetyCode(
    () => validateMigrationHistory(migrations, reordered),
    'MIGRATION_ORDER_INVALID',
  );
});

test('greenfield preflight reports every local migration as pending', async () => {
  const report = await runPreflight({
    database: databaseAdapter([greenfieldState()]),
    environment: environment({ AIRMAX_DB_DEPLOY_MODE: 'greenfield' }),
    processAdapter: processAdapter(),
  });
  assert.equal(report.classification, 'greenfield');
  assert.deepEqual(
    report.migrations.pending,
    migrations.map(migration => migration.name),
  );
  assert.equal(report.outcome, 'passed');
});

test('preflight rejects untracked objects and an unexpected deployment mode', async () => {
  await assert.rejects(
    runPreflight({
      database: databaseAdapter([
        {
          migrationTableExists: false,
          migrations: [],
          publicEnums: [],
          publicTables: ['legacy_users'],
        },
      ]),
      environment: environment({ AIRMAX_DB_DEPLOY_MODE: 'greenfield' }),
      processAdapter: processAdapter(),
    }),
    error => error.code === 'UNSUPPORTED_DATABASE',
  );
  await assert.rejects(
    runPreflight({
      database: databaseAdapter([greenfieldState()]),
      environment: environment(),
      processAdapter: processAdapter(),
    }),
    error => error.code === 'DATABASE_MODE_MISMATCH',
  );
});

test('tracked preflight validates repository and database migration history', async () => {
  let validateCalls = 0;
  const report = await runPreflight({
    database: databaseAdapter(),
    environment: environment(),
    processAdapter: processAdapter({
      async prismaValidate() {
        validateCalls += 1;
        return { exitCode: 0, stderr: '', stdout: 'valid' };
      },
      async releaseState() {
        return {
          available: true,
          clean: true,
          sha: 'a'.repeat(40),
        };
      },
    }),
  });
  assert.equal(validateCalls, 1);
  assert.deepEqual(report.migrations.pending, []);
  assert.equal(report.classification, 'tracked');
});

test('safe deployment runs preflight, deploy once, then postflight', async () => {
  const calls = [];
  const report = await runSafeDeploy({
    database: databaseAdapter([greenfieldState(), trackedState()]),
    environment: environment({ AIRMAX_DB_DEPLOY_MODE: 'greenfield' }),
    processAdapter: processAdapter({
      async healthCheck() {
        calls.push('health');
        return { status: 'passed' };
      },
      async prismaDeploy() {
        calls.push('deploy');
        return { exitCode: 0, stderr: '', stdout: 'migrated' };
      },
      async prismaStatus() {
        calls.push('status');
        return { exitCode: 0, stderr: '', stdout: 'up to date' };
      },
      async prismaValidate() {
        calls.push('validate');
        return { exitCode: 0, stderr: '', stdout: 'valid' };
      },
    }),
  });
  assert.deepEqual(calls, ['validate', 'deploy', 'status', 'health']);
  assert.equal(report.deploy.status, 'passed');
  assert.equal(report.verification.ownershipChecks, 'passed');
});

test('safe deployment stops after a failed deploy without repair or verification', async () => {
  let statusCalls = 0;
  await assert.rejects(
    runSafeDeploy({
      database: databaseAdapter(),
      environment: environment(),
      processAdapter: processAdapter({
        async prismaDeploy() {
          return {
            exitCode: 1,
            stderr: `connection failed for ${environment().DATABASE_URL}`,
            stdout: '',
          };
        },
        async prismaStatus() {
          statusCalls += 1;
          return { exitCode: 0, stderr: '', stdout: '' };
        },
      }),
    }),
    error => {
      assert.equal(error.code, 'MIGRATION_DEPLOY_FAILED');
      assert.doesNotMatch(JSON.stringify(error.details), /never-log-this/);
      return true;
    },
  );
  assert.equal(statusCalls, 0);
});

test('postflight rejects pending migrations and ownership violations', async () => {
  await assert.rejects(
    runVerify({
      database: databaseAdapter([trackedState(migrations.slice(0, -1))]),
      environment: environment(),
      processAdapter: processAdapter(),
    }),
    error => error.code === 'POSTFLIGHT_MIGRATION_FAILED',
  );

  const ownershipViolation = compatibleSchema({
    ownershipChecks: OWNERSHIP_CHECKS.map((check, index) => ({
      check,
      violationCount: index === 0 ? '1' : '0',
    })),
  });
  await assert.rejects(
    runVerify({
      database: databaseAdapter([trackedState()], {
        async inspectSchemaCompatibility() {
          return ownershipViolation;
        },
      }),
      environment: environment(),
      processAdapter: processAdapter(),
    }),
    error => error.code === 'POSTFLIGHT_OWNERSHIP_FAILED',
  );
});

test('postflight succeeds with compatible schema and passing health hooks', async () => {
  const report = await runVerify({
    database: databaseAdapter(),
    environment: environment({
      AIRMAX_HEALTH_BASE_URL: 'https://api.airmax.example',
    }),
    processAdapter: processAdapter({
      async healthCheck(baseUrl) {
        assert.equal(baseUrl, 'https://api.airmax.example');
        return {
          checks: [
            { path: '/api/v1/health/live', statusCode: 200 },
            { path: '/api/v1/health/ready', statusCode: 200 },
          ],
          status: 'passed',
        };
      },
    }),
  });
  assert.equal(report.outcome, 'passed');
  assert.equal(report.schemaCompatibility, 'passed');
});
