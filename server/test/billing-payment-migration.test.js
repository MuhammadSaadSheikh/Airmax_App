require('reflect-metadata');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} = require('@nestjs/common');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const {
  BillingPeriod,
  InvoiceEventType,
  InvoiceStatus,
  PaymentAttemptStatus,
  PaymentStatus,
  Prisma,
  Role,
  SubscriptionStatus,
} = require('@prisma/client');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const { CreateInvoiceDto } = require('../dist/invoices/dto/invoice.dto.js');
const {
  InvoicesController,
} = require('../dist/invoices/invoices.controller.js');
const { InvoicesService } = require('../dist/invoices/invoices.service.js');
const { CreatePaymentDto } = require('../dist/payments/dto/payment.dto.js');
const {
  PaymentsController,
} = require('../dist/payments/payments.controller.js');
const { PaymentsService } = require('../dist/payments/payments.service.js');

const userId = '10000000-0000-4000-8000-000000000001';
const otherUserId = '10000000-0000-4000-8000-000000000002';
const customerId = '20000000-0000-4000-8000-000000000001';
const subscriptionId = '30000000-0000-4000-8000-000000000001';
const invoiceId = '50000000-0000-4000-8000-000000000001';
const now = new Date('2026-08-26T00:00:00.000Z');
const actor = (overrides = {}) => ({
  sub: userId,
  role: Role.CUSTOMER,
  phone: '+923001234567',
  tokenType: 'access',
  jti: 'jti',
  ...overrides,
});
const admin = actor({ sub: otherUserId, role: Role.ADMIN });

function subscription(overrides = {}) {
  return {
    id: subscriptionId,
    customerId,
    status: SubscriptionStatus.ACTIVE,
    customer: {
      id: customerId,
      userId,
      name: 'Customer One',
      user: { phone: '+923001234567' },
    },
    package: {
      id: '40000000-0000-4000-8000-000000000001',
      name: 'Fiber 25',
      speedMbps: 25,
      price: new Prisma.Decimal('2500.00'),
      billingPeriod: BillingPeriod.MONTHLY,
    },
    ...overrides,
  };
}
function event(input, index) {
  return {
    id: `70000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    invoiceId,
    type: input.type,
    actorId: input.actor?.connect.id ?? input.actorId ?? null,
    previousStatus: input.previousStatus ?? null,
    currentStatus: input.currentStatus ?? null,
    metadata: input.metadata ?? null,
    occurredAt: now,
  };
}
function invoice(overrides = {}) {
  return {
    id: invoiceId,
    number: 'AMX-INV-0001',
    customerId,
    subscriptionId,
    customerNameSnapshot: 'Customer One',
    customerPhoneSnapshot: '+923001234567',
    packageNameSnapshot: 'Fiber 25',
    packageSpeedSnapshot: 25,
    amount: new Prisma.Decimal('2500.00'),
    billingPeriod: BillingPeriod.MONTHLY,
    periodStart: new Date('2026-08-01T00:00:00Z'),
    periodEnd: new Date('2026-09-01T00:00:00Z'),
    dueAt: new Date('2026-08-10T00:00:00Z'),
    status: InvoiceStatus.GENERATED,
    paidAt: null,
    cancelledAt: null,
    customer: { userId },
    events: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeInvoicesRepository {
  constructor({ subscriptions = [subscription()], invoices = [] } = {}) {
    this.subscriptions = subscriptions;
    this.invoices = invoices;
  }
  async findSubscription(id) {
    return this.subscriptions.find(x => x.id === id) ?? null;
  }
  async findCustomer(id) {
    const x = this.subscriptions.find(v => v.customerId === id);
    return x ? { id, userId: x.customer.userId } : null;
  }
  async findById(id) {
    return this.invoices.find(x => x.id === id) ?? null;
  }
  async findByCustomerId(id) {
    return this.invoices.filter(x => x.customerId === id);
  }
  async create(data) {
    const record = invoice({
      number: data.number,
      customerId: data.customer.connect.id,
      subscriptionId: data.subscription.connect.id,
      customerNameSnapshot: data.customerNameSnapshot,
      customerPhoneSnapshot: data.customerPhoneSnapshot,
      packageNameSnapshot: data.packageNameSnapshot,
      packageSpeedSnapshot: data.packageSpeedSnapshot,
      amount: data.amount,
      billingPeriod: data.billingPeriod,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      dueAt: data.dueAt,
      events: [event(data.events.create, 1)],
    });
    this.invoices.push(record);
    return record;
  }
  async transitionStatus(input) {
    const x = await this.findById(input.id);
    if (!x || x.status !== input.expectedStatus) return null;
    x.status = input.status;
    x.paidAt = input.paidAt ?? x.paidAt;
    x.cancelledAt = input.cancelledAt ?? x.cancelledAt;
    x.events.push(
      event(
        {
          type: input.type,
          actorId: input.actorId,
          previousStatus: input.expectedStatus,
          currentStatus: input.status,
          metadata: input.metadata,
        },
        x.events.length + 1,
      ),
    );
    return x;
  }
}

const attempt = (status, index, overrides = {}) => ({
  id: `80000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  paymentId: '',
  status,
  provider: null,
  providerReference: null,
  failureReason: null,
  metadata: { event: 'PAYMENT_ATTEMPT' },
  attemptedAt: now,
  ...overrides,
});

class FakePaymentsRepository {
  constructor({
    invoices = [invoice({ status: InvoiceStatus.PENDING })],
    payments = [],
  } = {}) {
    this.invoices = invoices;
    this.payments = payments;
  }
  async findInvoiceById(id) {
    return this.invoices.find(x => x.id === id) ?? null;
  }
  async findById(id) {
    return this.payments.find(x => x.id === id) ?? null;
  }
  async findByIdempotencyKey(key) {
    return this.payments.find(x => x.idempotencyKey === key) ?? null;
  }
  async findByInvoiceId(id) {
    return this.payments.filter(x => x.invoiceId === id);
  }
  async recordPayment(input) {
    const prior = await this.findByIdempotencyKey(input.idempotencyKey);
    if (prior) return { kind: 'idempotent', payment: prior };
    const bill = await this.findInvoiceById(input.invoiceId);
    if (!bill) return { kind: 'missing' };
    if (bill.status !== input.expectedInvoiceStatus)
      return { kind: 'invoice_changed' };
    const attemptStatus =
      input.status === PaymentStatus.SUCCESS
        ? PaymentAttemptStatus.SUCCESS
        : input.status === PaymentStatus.FAILED
          ? PaymentAttemptStatus.FAILED
          : PaymentAttemptStatus.PENDING;
    const record = {
      id: `60000000-0000-4000-8000-${String(this.payments.length + 1).padStart(12, '0')}`,
      invoiceId: bill.id,
      customerId: bill.customerId,
      amount: input.amount,
      method: input.method,
      status: input.status,
      externalReference: input.externalReference ?? null,
      idempotencyKey: input.idempotencyKey,
      processedAt: input.status === PaymentStatus.PENDING ? null : now,
      refundedAt: null,
      customer: { userId },
      attempts: [
        attempt(attemptStatus, 1, {
          provider: input.provider ?? null,
          providerReference: input.providerReference ?? null,
          failureReason: input.failureReason ?? null,
        }),
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.payments.push(record);
    if (input.status === PaymentStatus.SUCCESS) {
      bill.status = InvoiceStatus.PAID;
      bill.paidAt = now;
      bill.events.push(
        event(
          {
            type: InvoiceEventType.MARKED_PAID,
            actorId: input.actorId,
            previousStatus: input.expectedInvoiceStatus,
            currentStatus: InvoiceStatus.PAID,
            metadata: { event: 'PAYMENT_APPLIED', paymentId: record.id },
          },
          bill.events.length + 1,
        ),
      );
    }
    return { kind: 'created', payment: record };
  }
  async refund(input) {
    const x = await this.findById(input.id);
    if (!x || x.status !== input.expectedStatus) return null;
    x.status = PaymentStatus.REFUNDED;
    x.refundedAt = now;
    x.attempts.push(
      attempt(PaymentAttemptStatus.SUCCESS, x.attempts.length + 1, {
        providerReference: input.providerReference ?? null,
        metadata: { event: 'REFUNDED', reason: input.reason },
      }),
    );
    return x;
  }
}

test('billing DTOs reject malformed input and legacy statuses', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  await assert.rejects(() =>
    pipe.transform(
      {
        invoiceNumber: '',
        customerId: 'bad',
        subscriptionId: 'bad',
        amount: 0,
        billingStart: 'bad',
        billingEnd: 'bad',
        dueDate: 'bad',
      },
      { type: 'body', metatype: CreateInvoiceDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      { invoiceId, amount: 2500, paymentMethod: 'cash', status: 'UNPAID' },
      { type: 'body', metatype: CreatePaymentDto },
    ),
  );
});

test('invoice creation owns immutable customer/package snapshots', async () => {
  const repository = new FakeInvoicesRepository();
  const service = new InvoicesService(repository);
  const created = await service.createInvoice(
    {
      invoiceNumber: 'AMX-INV-0001',
      customerId,
      subscriptionId,
      amount: 2500,
      billingStart: '2026-08-01T00:00:00Z',
      billingEnd: '2026-09-01T00:00:00Z',
      dueDate: '2026-08-10T00:00:00Z',
    },
    admin,
  );
  assert.equal(created.customerId, customerId);
  assert.equal(created.subscriptionId, subscriptionId);
  assert.equal(created.events[0].type, InvoiceEventType.GENERATED);
  repository.subscriptions[0].package.name = 'Edited';
  repository.subscriptions[0].customer.name = 'Edited';
  assert.equal(created.packageName, 'Fiber 25');
  assert.equal(created.customerName, 'Customer One');
  assert.equal(created.events[0].metadata.packageSnapshot.price, '2500');
});

test('invoice lifecycle creates events and terminal records cannot change', async () => {
  const repository = new FakeInvoicesRepository({ invoices: [invoice()] });
  const service = new InvoicesService(repository);
  assert.equal(
    (
      await service.updateInvoiceStatus(
        invoiceId,
        { status: InvoiceStatus.PENDING },
        admin,
      )
    ).status,
    InvoiceStatus.PENDING,
  );
  const cancelled = await service.cancelInvoice(
    invoiceId,
    { reason: 'Correction' },
    admin,
  );
  assert.equal(cancelled.events.at(-1).type, InvoiceEventType.CANCELLED);
  await assert.rejects(
    () =>
      service.updateInvoiceStatus(
        invoiceId,
        { status: InvoiceStatus.PENDING },
        admin,
      ),
    ConflictException,
  );
  repository.invoices[0] = invoice({ status: InvoiceStatus.PAID });
  await assert.rejects(
    () => service.cancelInvoice(invoiceId, {}, admin),
    ConflictException,
  );
});

test('success payment records attempt, updates invoice, and is idempotent', async () => {
  const repository = new FakePaymentsRepository();
  const service = new PaymentsService(repository);
  const input = {
    invoiceId,
    amount: 2500,
    paymentMethod: 'bank',
    status: PaymentStatus.SUCCESS,
  };
  const paid = await service.createPayment(input, 'payment-key-1', admin);
  assert.equal(paid.attempts[0].status, PaymentAttemptStatus.SUCCESS);
  assert.equal(repository.invoices[0].status, InvoiceStatus.PAID);
  assert.equal(
    repository.invoices[0].events.at(-1).type,
    InvoiceEventType.MARKED_PAID,
  );
  assert.equal(
    (await service.createPayment(input, 'payment-key-1', admin)).id,
    paid.id,
  );
  assert.equal(repository.payments.length, 1);
  await assert.rejects(
    () =>
      service.createPayment(
        { ...input, paymentMethod: 'wallet' },
        'payment-key-1',
        admin,
      ),
    ConflictException,
  );
});

test('failed and pending attempts remain without paying invoice', async () => {
  const repository = new FakePaymentsRepository();
  const service = new PaymentsService(repository);
  const failed = await service.createPayment(
    {
      invoiceId,
      amount: 2500,
      paymentMethod: 'card',
      status: PaymentStatus.FAILED,
      failureReason: 'Provider declined',
    },
    'failed-key',
    admin,
  );
  const pending = await service.createPayment(
    {
      invoiceId,
      amount: 2500,
      paymentMethod: 'wallet',
      status: PaymentStatus.PENDING,
    },
    'pending-key',
    admin,
  );
  assert.equal(failed.attempts[0].status, PaymentAttemptStatus.FAILED);
  assert.equal(pending.attempts[0].status, PaymentAttemptStatus.PENDING);
  assert.equal(repository.invoices[0].status, InvoiceStatus.PENDING);
  assert.equal((await service.getInvoicePayments(invoiceId, admin)).length, 2);
});

test('invalid, terminal, and underpaid invoice payments are rejected', async () => {
  for (const status of [InvoiceStatus.CANCELLED, InvoiceStatus.PAID]) {
    const service = new PaymentsService(
      new FakePaymentsRepository({ invoices: [invoice({ status })] }),
    );
    await assert.rejects(
      () =>
        service.createPayment(
          {
            invoiceId,
            amount: 2500,
            paymentMethod: 'bank',
            status: PaymentStatus.SUCCESS,
          },
          `key-${status}`,
          admin,
        ),
      ConflictException,
    );
  }
  const service = new PaymentsService(new FakePaymentsRepository());
  await assert.rejects(
    () =>
      service.createPayment(
        {
          invoiceId,
          amount: 100,
          paymentMethod: 'bank',
          status: PaymentStatus.SUCCESS,
        },
        'underpaid',
        admin,
      ),
    BadRequestException,
  );
  await assert.rejects(
    () =>
      service.createPayment(
        {
          invoiceId: otherUserId,
          amount: 2500,
          paymentMethod: 'bank',
          status: PaymentStatus.SUCCESS,
        },
        'missing',
        admin,
      ),
    NotFoundException,
  );
});

test('refund preserves paid invoice and appends attempt history', async () => {
  const repository = new FakePaymentsRepository();
  const service = new PaymentsService(repository);
  const paid = await service.createPayment(
    {
      invoiceId,
      amount: 2500,
      paymentMethod: 'bank',
      status: PaymentStatus.SUCCESS,
    },
    'refund-source',
    admin,
  );
  const refunded = await service.refundPayment(
    paid.id,
    { reason: 'Bank reversal' },
    admin,
  );
  assert.equal(refunded.status, PaymentStatus.REFUNDED);
  assert.equal(refunded.attempts.at(-1).metadata.event, 'REFUNDED');
  assert.equal(repository.invoices[0].status, InvoiceStatus.PAID);
});

test('billing access is owner/admin scoped and mutations are admin-only', async () => {
  const invoices = new InvoicesService(
    new FakeInvoicesRepository({ invoices: [invoice()] }),
  );
  await assert.rejects(
    () => invoices.getInvoiceById(invoiceId, actor({ sub: otherUserId })),
    ForbiddenException,
  );
  await assert.rejects(
    () => invoices.cancelInvoice(invoiceId, {}, actor()),
    ForbiddenException,
  );
  const payments = new PaymentsService(new FakePaymentsRepository());
  await assert.rejects(
    () =>
      payments.createPayment(
        {
          invoiceId,
          amount: 2500,
          paymentMethod: 'bank',
          status: PaymentStatus.SUCCESS,
        },
        'customer-key',
        actor(),
      ),
    ForbiddenException,
  );
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, InvoicesController), [
    JwtAuthGuard,
    RolesGuard,
  ]);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, InvoicesController.prototype.create),
    [Role.ADMIN],
  );
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PaymentsController), [
    JwtAuthGuard,
    RolesGuard,
  ]);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, PaymentsController.prototype.create),
    [Role.ADMIN],
  );
});
