require('reflect-metadata');

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const { InvoiceStatus, Prisma, Role } = require('@prisma/client');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const { ReportsController } = require('../dist/reports/reports.controller.js');
const { ReportsService } = require('../dist/reports/reports.service.js');

class FakeReportsRepository {
  async getAnalyticsSnapshot() {
    return {
      customers: 12,
      activeConnections: 9,
      openComplaints: 3,
      invoices: [
        {
          status: InvoiceStatus.PAID,
          _count: { _all: 5 },
          _sum: { amount: new Prisma.Decimal('12500.50') },
        },
        {
          status: InvoiceStatus.PENDING,
          _count: { _all: 2 },
          _sum: { amount: new Prisma.Decimal('4000.25') },
        },
        {
          status: InvoiceStatus.OVERDUE,
          _count: { _all: 1 },
          _sum: { amount: new Prisma.Decimal('2000.10') },
        },
        {
          status: InvoiceStatus.CANCELLED,
          _count: { _all: 4 },
          _sum: { amount: new Prisma.Decimal('8000') },
        },
      ],
    };
  }
}

test('reports consume production invoice statuses and preserve analytics compatibility', async () => {
  const result = await new ReportsService(
    new FakeReportsRepository(),
  ).getAnalytics();
  assert.equal(result.customers, 12);
  assert.equal(result.activeConnections, 9);
  assert.equal(result.openComplaints, 3);
  assert.equal(result.revenue, '12500.5');
  assert.equal(result.pending, '6000.35');
  assert.equal(result.paidInvoices.count, 5);
  assert.equal(result.paidInvoices.amount, '12500.5');
  assert.equal(result.pendingInvoices.count, 2);
  assert.equal(result.pendingInvoices.amount, '4000.25');
  assert.equal(result.overdueInvoices.count, 1);
  assert.equal(result.overdueInvoices.amount, '2000.1');
  assert.equal(result.cancelledInvoices.count, 4);
  assert.equal(result.cancelledInvoices.amount, '8000');
});

test('missing invoice groups produce stable zero metrics', async () => {
  const repository = new FakeReportsRepository();
  repository.getAnalyticsSnapshot = async () => ({
    customers: 0,
    activeConnections: 0,
    openComplaints: 0,
    invoices: [],
  });
  const result = await new ReportsService(repository).getAnalytics();
  assert.equal(result.revenue, '0');
  assert.equal(result.pending, '0');
  assert.equal(result.cancelledInvoices.count, 0);
  assert.equal(result.cancelledInvoices.amount, '0');
});

test('reports endpoint remains JWT protected and admin-only', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, ReportsController);
  assert.ok(guards.includes(JwtAuthGuard));
  assert.ok(guards.includes(RolesGuard));
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, ReportsController), [
    Role.ADMIN,
  ]);
});

test('reports use controller-service-repository boundary without legacy enums', () => {
  const root = join(__dirname, '..', 'src', 'reports');
  const controller = readFileSync(join(root, 'reports.controller.ts'), 'utf8');
  const service = readFileSync(join(root, 'reports.service.ts'), 'utf8');
  const repository = readFileSync(join(root, 'reports.repository.ts'), 'utf8');
  assert.doesNotMatch(controller, /PrismaService/);
  assert.match(controller, /ReportsService/);
  assert.match(service, /ReportsRepository/);
  assert.match(repository, /prisma\.customer\.count/);
  assert.match(repository, /prisma\.subscription\.count/);
  assert.match(repository, /InvoiceStatus\.PENDING/);
  assert.doesNotMatch(
    `${controller}\n${service}\n${repository}`,
    /InvoiceStatus\.(UNPAID|DRAFT|VOID)/,
  );
});

test('global HTTP foundation still owns envelopes, errors, and request correlation', () => {
  const foundation = readFileSync(
    join(__dirname, '..', 'src/common/http/http-foundation.module.ts'),
    'utf8',
  );
  const main = readFileSync(join(__dirname, '..', 'src/main.ts'), 'utf8');
  const appModule = readFileSync(
    join(__dirname, '..', 'src/app.module.ts'),
    'utf8',
  );
  assert.match(foundation, /ResponseEnvelopeInterceptor/);
  assert.match(foundation, /ApiExceptionFilter/);
  assert.match(foundation, /HttpLoggingInterceptor/);
  assert.match(appModule, /RequestIdMiddleware/);
  assert.match(main, /createGlobalValidationPipe/);
});
