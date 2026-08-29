const { randomUUID } = require('node:crypto');
const { mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const SERVER_ROOT = resolve(__dirname, '../..');

function createDatabaseAdapter(databaseUrl) {
  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
    log: [],
  });

  return {
    async close() {
      await prisma.$disconnect();
    },

    async inspectIdentity() {
      const [row] = await prisma.$queryRawUnsafe(`
        SELECT
          current_database() AS "databaseName",
          current_setting('server_version') AS "postgresVersion",
          pg_is_in_recovery() AS "inRecovery",
          current_setting('transaction_read_only') = 'on' AS "transactionReadOnly",
          has_schema_privilege(current_user, 'public', 'CREATE') AS "canCreateInPublicSchema"
      `);
      return row;
    },

    async inspectSchemaCompatibility() {
      const tables = await listPublicTables(prisma);
      const enums = await listPublicEnums(prisma);
      const columnRows = await prisma.$queryRawUnsafe(`
        SELECT table_name AS "table", column_name AS "column"
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);
      const columnsByTable = new Map();
      for (const row of columnRows) {
        const columns = columnsByTable.get(row.table) ?? [];
        columns.push(row.column);
        columnsByTable.set(row.table, columns);
      }
      const foreignKeys = await prisma.$queryRawUnsafe(`
        SELECT
          tc.table_name AS "table",
          kcu.column_name AS "column",
          ccu.table_name AS "foreignTable",
          ccu.column_name AS "foreignColumn"
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.constraint_schema = kcu.constraint_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.constraint_schema = tc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `);
      const ownershipChecks = await prisma.$queryRawUnsafe(`
        SELECT 'customer_user_role' AS "check", COUNT(*)::text AS "violationCount"
          FROM "Customer" c
          JOIN "User" u ON u.id = c."userId"
         WHERE u.role <> 'CUSTOMER'
        UNION ALL
        SELECT 'invoice_subscription_customer', COUNT(*)::text
          FROM "Invoice" i
          JOIN "Subscription" s ON s.id = i."subscriptionId"
         WHERE i."customerId" <> s."customerId"
        UNION ALL
        SELECT 'payment_invoice_customer', COUNT(*)::text
          FROM "Payment" p
          JOIN "Invoice" i ON i.id = p."invoiceId"
         WHERE p."customerId" <> i."customerId"
        UNION ALL
        SELECT 'work_order_assignment_complaint', COUNT(*)::text
          FROM "WorkOrder" w
          JOIN "TechnicianAssignment" a ON a.id = w."assignmentId"
         WHERE w."complaintId" <> a."complaintId"
        UNION ALL
        SELECT 'work_order_assignment_technician', COUNT(*)::text
          FROM "WorkOrder" w
          JOIN "TechnicianAssignment" a ON a.id = w."assignmentId"
         WHERE w."technicianId" <> a."technicianId"
        UNION ALL
        SELECT 'work_order_complaint_customer', COUNT(*)::text
          FROM "WorkOrder" w
          JOIN "Complaint" c ON c.id = w."complaintId"
         WHERE w."customerId" <> c."customerId"
      `);
      return {
        columns: [...columnsByTable].map(([table, columns]) => ({
          columns,
          table,
        })),
        enums,
        foreignKeys,
        ownershipChecks,
        tables,
      };
    },

    async inspectState() {
      const [migrationTable] = await prisma.$queryRawUnsafe(`
        SELECT to_regclass('public."_prisma_migrations"') IS NOT NULL AS "exists"
      `);
      const migrationTableExists = Boolean(migrationTable.exists);
      const migrations = migrationTableExists
        ? await prisma.$queryRawUnsafe(`
            SELECT
              migration_name AS "name",
              checksum,
              finished_at AS "finishedAt",
              rolled_back_at AS "rolledBackAt",
              started_at AS "startedAt"
            FROM "_prisma_migrations"
            ORDER BY started_at, migration_name
          `)
        : [];
      return {
        migrationTableExists,
        migrations,
        publicEnums: await listPublicEnums(prisma),
        publicTables: await listPublicTables(prisma),
      };
    },
  };
}

async function listPublicTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name AS "name"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name
  `);
  return rows.map(row => row.name);
}

async function listPublicEnums(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT t.typname AS "name"
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
    ORDER BY t.typname
  `);
  return rows.map(row => row.name);
}

function createProcessAdapter(environment) {
  const prismaCli = require.resolve('prisma/build/index.js');

  function run(command, args = []) {
    const result = spawnSync(command, args, {
      cwd: SERVER_ROOT,
      encoding: 'utf8',
      env: environment,
      maxBuffer: 10 * 1024 * 1024,
      shell: false,
    });
    return {
      exitCode: result.status ?? 1,
      stderr: result.error
        ? `${result.stderr ?? ''}\n${result.error.message}`
        : (result.stderr ?? ''),
      stdout: result.stdout ?? '',
    };
  }

  function prisma(...args) {
    return run(process.execPath, [prismaCli, ...args]);
  }

  return {
    async healthCheck(baseUrl) {
      if (!baseUrl) return { status: 'skipped' };
      let origin;
      try {
        const url = new URL(baseUrl);
        if (
          url.protocol !== 'https:' ||
          url.username ||
          url.password ||
          url.pathname !== '/' ||
          url.search ||
          url.hash
        ) {
          throw new Error('unsafe health base URL');
        }
        origin = url.origin;
      } catch {
        return {
          reason: 'AIRMAX_HEALTH_BASE_URL must be an HTTPS origin',
          status: 'failed',
        };
      }
      const checks = [];
      for (const path of ['/api/v1/health/live', '/api/v1/health/ready']) {
        try {
          const response = await fetch(`${origin}${path}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5_000),
          });
          checks.push({ path, statusCode: response.status });
          if (!response.ok) return { checks, status: 'failed' };
        } catch (error) {
          checks.push({
            error: error instanceof Error ? error.name : 'HealthCheckError',
            path,
          });
          return { checks, status: 'failed' };
        }
      }
      return { checks, status: 'passed' };
    },

    async prismaDeploy() {
      return prisma('migrate', 'deploy');
    },

    async prismaStatus() {
      return prisma('migrate', 'status');
    },

    async prismaValidate() {
      return prisma('validate');
    },

    async releaseState() {
      const sha = run('git', ['rev-parse', 'HEAD']);
      if (sha.exitCode !== 0) return { available: false };
      const status = run('git', ['status', '--porcelain']);
      if (status.exitCode !== 0) return { available: false };
      return {
        available: true,
        clean: !status.stdout.trim(),
        sha: sha.stdout.trim(),
      };
    },
  };
}

function writeDeploymentReport(report, reportDir) {
  mkdirSync(reportDir, { recursive: true, mode: 0o700 });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = resolve(
    reportDir,
    `${timestamp}-${report.phase}-${randomUUID()}.json`,
  );
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
  return file;
}

module.exports = {
  createDatabaseAdapter,
  createProcessAdapter,
  writeDeploymentReport,
};
