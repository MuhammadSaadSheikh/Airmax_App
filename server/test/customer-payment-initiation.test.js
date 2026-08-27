require('reflect-metadata');

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const {
  InvoiceEventType,
  InvoiceStatus,
  PaymentAttemptStatus,
  PaymentStatus,
  Prisma,
  Role,
} = require('@prisma/client');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const {
  createGlobalValidationPipe,
} = require('../dist/common/http/validation.js');
const {
  ConfirmPaymentDto,
  InitiatePaymentDto,
} = require('../dist/payments/dto/payment.dto.js');
const {
  PaymentsController,
} = require('../dist/payments/payments.controller.js');
const { PaymentsService } = require('../dist/payments/payments.service.js');

const userId = '10000000-0000-4000-8000-000000000001';
const otherUserId = '10000000-0000-4000-8000-000000000002';
const adminId = '10000000-0000-4000-8000-000000000003';
const customerId = '20000000-0000-4000-8000-000000000001';
const subscriptionId = '30000000-0000-4000-8000-000000000001';
const invoiceId = '50000000-0000-4000-8000-000000000001';
const now = new Date('2026-08-27T00:00:00.000Z');

const actor = (overrides = {}) => ({
  sub: userId,
  role: Role.CUSTOMER,
  phone: '+923001234567',
  tokenType: 'access',
  jti: 'jti',
  ...overrides,
});
const admin = actor({ sub: adminId, role: Role.ADMIN });

function invoice(overrides = {}) {
  return {
    id: invoiceId,
    customerId,
    subscriptionId,
    amount: new Prisma.Decimal('2500.00'),
    status: InvoiceStatus.PENDING,
    customer: { userId },
    subscription: { customerId },
    events: [],
    paidAt: null,
    ...overrides,
  };
}

function paymentAttempt(status, index, overrides = {}) {
  return {
    id: `80000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    paymentId: '',
    status,
    provider: null,
    providerReference: null,
    failureReason: null,
    metadata: null,
    attemptedAt: now,
    ...overrides,
  };
}

class FakeCustomerPaymentsRepository {
  constructor({ invoices = [invoice()], users = [userId] } = {}) {
    this.invoices = invoices;
    this.users = users;
    this.payments = [];
  }

  async findCustomerByUserId(id) {
    return this.users.includes(id) ? { id: customerId, userId: id } : null;
  }

  async findByIdempotencyKey(key) {
    return this.payments.find(item => item.idempotencyKey === key) ?? null;
  }

  async findById(id) {
    return this.payments.find(item => item.id === id) ?? null;
  }

  async findInvoiceById(id) {
    return this.invoices.find(item => item.id === id) ?? null;
  }

  async findByInvoiceId(id) {
    return this.payments.filter(item => item.invoiceId === id);
  }

  async initiateCustomerPayment(input) {
    const prior = await this.findByIdempotencyKey(input.idempotencyKey);
    if (prior) return { kind: 'idempotent', payment: prior };
    const bill = await this.findInvoiceById(input.invoiceId);
    if (!bill) return { kind: 'missing' };
    if (bill.customer.userId !== input.customerUserId) {
      return { kind: 'forbidden' };
    }
    if (bill.subscription.customerId !== bill.customerId) {
      return { kind: 'invalid_subscription' };
    }
    if (
      bill.status !== InvoiceStatus.PENDING &&
      bill.status !== InvoiceStatus.OVERDUE
    ) {
      return { kind: 'invoice_not_payable', status: bill.status };
    }
    if (
      this.payments.some(
        item =>
          item.invoiceId === bill.id && item.status === PaymentStatus.PENDING,
      )
    ) {
      return { kind: 'active_attempt' };
    }
    const record = {
      id: `60000000-0000-4000-8000-${String(this.payments.length + 1).padStart(12, '0')}`,
      invoiceId: bill.id,
      customerId: bill.customerId,
      amount: bill.amount,
      method: input.method,
      status: PaymentStatus.PENDING,
      externalReference: null,
      idempotencyKey: input.idempotencyKey,
      processedAt: null,
      refundedAt: null,
      customer: { userId: bill.customer.userId },
      attempts: [
        paymentAttempt(PaymentAttemptStatus.PENDING, 1, {
          metadata: {
            event: 'PAYMENT_INITIATED',
            providerMetadata: input.providerMetadata,
          },
        }),
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.payments.push(record);
    return { kind: 'created', payment: record };
  }

  async confirmCustomerPayment(input) {
    const record = await this.findById(input.id);
    if (!record) return { kind: 'missing' };
    const bill = await this.findInvoiceById(record.invoiceId);
    if (!bill) return { kind: 'invoice_missing' };
    if (record.status !== PaymentStatus.PENDING) {
      return { kind: 'payment_changed' };
    }
    const successful = input.result === PaymentAttemptStatus.SUCCESS;
    if (
      successful &&
      bill.status !== InvoiceStatus.PENDING &&
      bill.status !== InvoiceStatus.OVERDUE
    ) {
      return { kind: 'invoice_changed' };
    }
    record.status = successful ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    record.externalReference = input.providerReference;
    record.processedAt = now;
    record.attempts.push(
      paymentAttempt(input.result, record.attempts.length + 1, {
        provider: input.provider ?? null,
        providerReference: input.providerReference,
        failureReason: input.failureReason ?? null,
        metadata: { event: 'PAYMENT_CONFIRMED', result: input.result },
      }),
    );
    if (successful) {
      const previousStatus = bill.status;
      bill.status = InvoiceStatus.PAID;
      bill.paidAt = now;
      bill.events.push({
        type: InvoiceEventType.MARKED_PAID,
        actorId: input.actorId,
        previousStatus,
        currentStatus: InvoiceStatus.PAID,
        metadata: { event: 'PAYMENT_APPLIED', paymentId: record.id },
      });
    }
    return { kind: 'confirmed', payment: record };
  }
}

test('initiation DTO accepts no client financial authority', async () => {
  const pipe = createGlobalValidationPipe();
  await assert.rejects(() =>
    pipe.transform(
      {
        invoiceId,
        paymentMethod: 'wallet',
        amount: 1,
        status: PaymentStatus.SUCCESS,
      },
      { type: 'body', metatype: InitiatePaymentDto },
    ),
  );
  const valid = await pipe.transform(
    { invoiceId, paymentMethod: 'wallet' },
    { type: 'body', metatype: InitiatePaymentDto },
  );
  assert.equal('amount' in valid, false);
  assert.equal('status' in valid, false);
});

test('customer initiation derives amount from invoice and is idempotent', async () => {
  const repository = new FakeCustomerPaymentsRepository();
  const service = new PaymentsService(repository);
  const input = {
    invoiceId,
    paymentMethod: 'wallet',
    amount: 1,
    status: PaymentStatus.SUCCESS,
    providerMetadata: { channel: 'mobile' },
  };
  const initiated = await service.initiatePayment(
    input,
    'customer-key',
    actor(),
  );
  assert.equal(initiated.amount, '2500');
  assert.equal(initiated.status, PaymentStatus.PENDING);
  assert.equal(initiated.attempts[0].status, PaymentAttemptStatus.PENDING);
  assert.equal(repository.invoices[0].status, InvoiceStatus.PENDING);
  assert.equal(
    (await service.initiatePayment(input, 'customer-key', actor())).id,
    initiated.id,
  );
  assert.equal(repository.payments.length, 1);
  await assert.rejects(
    () =>
      service.initiatePayment(
        { invoiceId, paymentMethod: 'card' },
        'customer-key',
        actor(),
      ),
    ConflictException,
  );
  await assert.rejects(
    () =>
      service.initiatePayment(
        { invoiceId, paymentMethod: 'wallet' },
        'different-key',
        actor(),
      ),
    ConflictException,
  );
});

test('initiation rejects missing customers, foreign invoices, and invalid subscription ownership', async () => {
  const missingCustomer = new PaymentsService(
    new FakeCustomerPaymentsRepository({ users: [] }),
  );
  await assert.rejects(
    () =>
      missingCustomer.initiatePayment(
        { invoiceId, paymentMethod: 'wallet' },
        'missing-customer',
        actor(),
      ),
    NotFoundException,
  );

  const repository = new FakeCustomerPaymentsRepository();
  repository.users.push(otherUserId);
  const service = new PaymentsService(repository);
  await assert.rejects(
    () =>
      service.initiatePayment(
        { invoiceId, paymentMethod: 'wallet' },
        'foreign-invoice',
        actor({ sub: otherUserId }),
      ),
    ForbiddenException,
  );
  repository.invoices[0].subscription.customerId =
    '20000000-0000-4000-8000-000000000099';
  await assert.rejects(
    () =>
      service.initiatePayment(
        { invoiceId, paymentMethod: 'wallet' },
        'invalid-subscription',
        actor(),
      ),
    ConflictException,
  );
});

test('cancelled and already-paid invoices cannot be initiated', async () => {
  for (const status of [InvoiceStatus.CANCELLED, InvoiceStatus.PAID]) {
    const service = new PaymentsService(
      new FakeCustomerPaymentsRepository({ invoices: [invoice({ status })] }),
    );
    await assert.rejects(
      () =>
        service.initiatePayment(
          { invoiceId, paymentMethod: 'bank' },
          `terminal-${status}`,
          actor(),
        ),
      ConflictException,
    );
  }
});

test('successful confirmation appends history and atomically marks invoice paid', async () => {
  const repository = new FakeCustomerPaymentsRepository();
  const service = new PaymentsService(repository);
  const initiated = await service.initiatePayment(
    { invoiceId, paymentMethod: 'wallet' },
    'success-key',
    actor(),
  );
  const confirmed = await service.confirmPayment(
    initiated.id,
    {
      providerReference: 'provider-success-1',
      provider: 'placeholder',
      result: PaymentAttemptStatus.SUCCESS,
    },
    admin,
  );
  assert.equal(confirmed.status, PaymentStatus.SUCCESS);
  assert.deepEqual(
    confirmed.attempts.map(item => item.status),
    [PaymentAttemptStatus.PENDING, PaymentAttemptStatus.SUCCESS],
  );
  assert.equal(repository.invoices[0].status, InvoiceStatus.PAID);
  assert.equal(
    repository.invoices[0].events.at(-1).type,
    InvoiceEventType.MARKED_PAID,
  );
  await assert.rejects(
    () =>
      service.confirmPayment(
        initiated.id,
        {
          providerReference: 'provider-success-2',
          result: PaymentAttemptStatus.SUCCESS,
        },
        admin,
      ),
    ConflictException,
  );
});

test('failed confirmation preserves invoice and permits a new valid attempt', async () => {
  const repository = new FakeCustomerPaymentsRepository();
  const service = new PaymentsService(repository);
  const initiated = await service.initiatePayment(
    { invoiceId, paymentMethod: 'card' },
    'failed-key',
    actor(),
  );
  await assert.rejects(
    () =>
      service.confirmPayment(
        initiated.id,
        {
          providerReference: 'provider-failed-0',
          result: PaymentAttemptStatus.FAILED,
        },
        admin,
      ),
    BadRequestException,
  );
  const failed = await service.confirmPayment(
    initiated.id,
    {
      providerReference: 'provider-failed-1',
      result: PaymentAttemptStatus.FAILED,
      failureReason: 'Provider declined',
    },
    admin,
  );
  assert.equal(failed.status, PaymentStatus.FAILED);
  assert.equal(failed.attempts.length, 2);
  assert.equal(repository.invoices[0].status, InvoiceStatus.PENDING);
  const retry = await service.initiatePayment(
    { invoiceId, paymentMethod: 'card' },
    'retry-key',
    actor(),
  );
  assert.notEqual(retry.id, initiated.id);
  assert.equal(retry.status, PaymentStatus.PENDING);
});

test('customers cannot confirm outcomes, view foreign payments, or use admin recording route', async () => {
  const repository = new FakeCustomerPaymentsRepository();
  const service = new PaymentsService(repository);
  const initiated = await service.initiatePayment(
    { invoiceId, paymentMethod: 'wallet' },
    'security-key',
    actor(),
  );
  await assert.rejects(
    () =>
      service.confirmPayment(
        initiated.id,
        {
          providerReference: 'forbidden-result',
          result: PaymentAttemptStatus.SUCCESS,
        },
        actor(),
      ),
    ForbiddenException,
  );
  await assert.rejects(
    () => service.getPaymentById(initiated.id, actor({ sub: otherUserId })),
    ForbiddenException,
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
        'admin-route-key',
        actor(),
      ),
    ForbiddenException,
  );
});

test('controller RBAC keeps customer initiation separate from admin confirmation and recording', () => {
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PaymentsController), [
    JwtAuthGuard,
    RolesGuard,
  ]);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, PaymentsController.prototype.initiate),
    [Role.CUSTOMER],
  );
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, PaymentsController.prototype.confirm),
    [Role.ADMIN],
  );
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, PaymentsController.prototype.create),
    [Role.ADMIN],
  );
});

test('repository enforces database amount authority and transactional invoice locking', () => {
  const source = readFileSync(
    join(__dirname, '../src/payments/payments.repository.ts'),
    'utf8',
  );
  const initiation = source.slice(
    source.indexOf('async initiateCustomerPayment'),
    source.indexOf('async confirmCustomerPayment'),
  );
  assert.match(initiation, /\$transaction/);
  assert.match(initiation, /FOR UPDATE/);
  assert.match(initiation, /amount: invoice\.amount/);
  assert.doesNotMatch(initiation, /input\.amount/);

  const confirmation = source.slice(
    source.indexOf('async confirmCustomerPayment'),
    source.indexOf('async recordPayment'),
  );
  assert.match(confirmation, /\$transaction/);
  assert.match(confirmation, /FROM "Invoice"[\s\S]*FOR UPDATE/);
  assert.match(confirmation, /paymentAttempt\.create/);
  assert.match(confirmation, /invoice\.update/);
});
