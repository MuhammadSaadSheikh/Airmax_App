require('reflect-metadata');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} = require('@nestjs/common');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const {
  BillingPeriod,
  CustomerStatus,
  PackageStatus,
  Prisma,
  Role,
  SubscriptionHistoryType,
  SubscriptionStatus,
} = require('@prisma/client');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const { CreatePackageDto } = require('../dist/packages/dto/package.dto.js');
const {
  PackagesController,
} = require('../dist/packages/packages.controller.js');
const { PackagesService } = require('../dist/packages/packages.service.js');
const {
  CreateSubscriptionDto,
} = require('../dist/subscriptions/dto/subscription.dto.js');
const {
  SubscriptionsController,
} = require('../dist/subscriptions/subscriptions.controller.js');
const {
  SubscriptionsService,
} = require('../dist/subscriptions/subscriptions.service.js');

const userId = '10000000-0000-4000-8000-000000000001';
const otherUserId = '10000000-0000-4000-8000-000000000002';
const customerId = '20000000-0000-4000-8000-000000000001';
const firstPackageId = '30000000-0000-4000-8000-000000000001';
const secondPackageId = '30000000-0000-4000-8000-000000000002';
const subscriptionId = '40000000-0000-4000-8000-000000000001';
const now = new Date('2026-08-26T00:00:00.000Z');

function packageRecord(overrides = {}) {
  return {
    id: firstPackageId,
    name: 'Fiber 25',
    description: 'Foundation package',
    speedMbps: 25,
    price: new Prisma.Decimal('2500.00'),
    billingPeriod: BillingPeriod.MONTHLY,
    features: ['Fiber'],
    status: PackageStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakePackagesRepository {
  constructor(packages = []) {
    this.packages = packages;
  }
  async create(data) {
    const record = packageRecord({
      id: `30000000-0000-4000-8000-${String(this.packages.length + 1).padStart(12, '0')}`,
      ...data,
    });
    this.packages.push(record);
    return record;
  }
  async findById(id) {
    return this.packages.find(item => item.id === id) ?? null;
  }
  async findMany(includeInactive) {
    return this.packages.filter(
      item => includeInactive || item.status === PackageStatus.ACTIVE,
    );
  }
  async update(id, data) {
    const record = await this.findById(id);
    Object.assign(
      record,
      Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
      { updatedAt: now },
    );
    return record;
  }
}

function actor(overrides = {}) {
  return {
    sub: userId,
    role: Role.CUSTOMER,
    phone: '+923001234567',
    tokenType: 'access',
    jti: 'jti',
    ...overrides,
  };
}

function normalizeHistory(input, index) {
  return {
    id: `50000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    type: input.type,
    actorId: input.actor?.connect.id ?? null,
    previousStatus: input.previousStatus ?? null,
    currentStatus: input.currentStatus ?? null,
    previousPackageId: input.previousPackage?.connect.id ?? null,
    currentPackageId: input.currentPackage?.connect.id ?? null,
    packageName: input.packageName ?? null,
    packageSpeedMbps: input.packageSpeedMbps ?? null,
    packagePrice: input.packagePrice ?? null,
    billingPeriod: input.billingPeriod ?? null,
    metadata: input.metadata ?? null,
    occurredAt: now,
  };
}

class FakeSubscriptionsRepository {
  constructor({ customers, packages, subscriptions = [] }) {
    this.customers = customers;
    this.packages = packages;
    this.subscriptions = subscriptions;
  }
  async findCustomerById(id) {
    return this.customers.find(item => item.id === id) ?? null;
  }
  async findPackageById(id) {
    return this.packages.find(item => item.id === id) ?? null;
  }
  async findById(id) {
    return this.subscriptions.find(item => item.id === id) ?? null;
  }
  async findByCustomerId(id) {
    return this.subscriptions.filter(item => item.customerId === id);
  }
  async createIfNoLive(id, packageId, expectedPackageUpdatedAt, data) {
    const lockedPackage = await this.findPackageById(packageId);
    if (
      !lockedPackage ||
      lockedPackage.status !== PackageStatus.ACTIVE ||
      lockedPackage.updatedAt.getTime() !== expectedPackageUpdatedAt.getTime()
    ) {
      return { kind: 'package_changed' };
    }
    if (
      this.subscriptions.some(
        item =>
          item.customerId === id &&
          [
            SubscriptionStatus.PENDING,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.SUSPENDED,
          ].includes(item.status),
      )
    )
      return { kind: 'duplicate' };
    const record = {
      id: subscriptionId,
      customerId: id,
      packageId,
      status: SubscriptionStatus.PENDING,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      cancelledAt: null,
      pppoeUsername: null,
      customer: { userId: this.customers.find(item => item.id === id).userId },
      package: await this.findPackageById(packageId),
      history: [normalizeHistory(data.history.create, 1)],
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.push(record);
    return { kind: 'created', subscription: record };
  }
  async updateWithActivePackage(id, packageId, expectedPackageUpdatedAt, data) {
    const lockedPackage = await this.findPackageById(packageId);
    if (
      !lockedPackage ||
      lockedPackage.status !== PackageStatus.ACTIVE ||
      lockedPackage.updatedAt.getTime() !== expectedPackageUpdatedAt.getTime()
    )
      return null;
    return this.update(id, data);
  }
  async update(id, data) {
    const record = await this.findById(id);
    if (data.package?.connect.id) {
      record.packageId = data.package.connect.id;
      record.package = await this.findPackageById(record.packageId);
    }
    if (data.status) record.status = data.status;
    if (data.cancelledAt) record.cancelledAt = data.cancelledAt;
    if (data.history?.create)
      record.history.push(
        normalizeHistory(data.history.create, record.history.length + 1),
      );
    record.updatedAt = now;
    return record;
  }
}

function subscriptionFixture(repository, overrides = {}) {
  const firstPackage = repository.packages[0];
  return {
    id: subscriptionId,
    customerId,
    packageId: firstPackage.id,
    status: SubscriptionStatus.PENDING,
    startsAt: now,
    endsAt: null,
    cancelledAt: null,
    pppoeUsername: null,
    customer: { userId },
    package: firstPackage,
    history: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test('package and subscription DTOs reject invalid commercial input', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  await assert.rejects(() =>
    pipe.transform(
      { name: '', speedMbps: 0, price: -1, billingPeriod: 'WEEKLY' },
      { type: 'body', metatype: CreatePackageDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      { customerId: 'bad', packageId: 'bad' },
      { type: 'body', metatype: CreateSubscriptionDto },
    ),
  );
});

test('package catalogue supports create, update, activation, and soft deactivation', async () => {
  const repository = new FakePackagesRepository();
  const service = new PackagesService(repository);
  const created = await service.createPackage({
    name: 'Fiber 25',
    speedMbps: 25,
    price: 2500,
    billingPeriod: BillingPeriod.MONTHLY,
  });
  assert.equal(created.price, '2500');
  assert.equal(
    (await service.updatePackage(created.id, { speedMbps: 30 })).speedMbps,
    30,
  );
  assert.equal(
    (await service.deactivatePackage(created.id)).status,
    PackageStatus.INACTIVE,
  );
  assert.equal((await service.getPackages()).length, 0);
  assert.equal((await service.getPackages(true)).length, 1);
  assert.equal(
    (await service.activatePackage(created.id)).status,
    PackageStatus.ACTIVE,
  );
});

test('subscription creation validates customer, active package, and live uniqueness', async () => {
  const packages = [packageRecord()];
  const customers = [{ id: customerId, userId, status: CustomerStatus.ACTIVE }];
  const repository = new FakeSubscriptionsRepository({ customers, packages });
  const service = new SubscriptionsService(repository);
  const created = await service.createSubscription(
    { customerId, packageId: firstPackageId },
    actor(),
  );
  assert.equal(created.customerId, customerId);
  assert.equal(created.history[0].type, SubscriptionHistoryType.CREATED);
  await assert.rejects(
    () =>
      service.createSubscription(
        { customerId, packageId: firstPackageId },
        actor(),
      ),
    ConflictException,
  );
  packages[0].status = PackageStatus.INACTIVE;
  repository.subscriptions.length = 0;
  await assert.rejects(
    () =>
      service.createSubscription(
        { customerId, packageId: firstPackageId },
        actor(),
      ),
    ConflictException,
  );
  await assert.rejects(
    () =>
      service.createSubscription(
        { customerId: otherUserId, packageId: firstPackageId },
        actor(),
      ),
    NotFoundException,
  );
});

test('package changes preserve previous and current immutable snapshots', async () => {
  const packages = [
    packageRecord(),
    packageRecord({
      id: secondPackageId,
      name: 'Fiber 50',
      speedMbps: 50,
      price: new Prisma.Decimal('4500.00'),
    }),
  ];
  const repository = new FakeSubscriptionsRepository({
    customers: [{ id: customerId, userId }],
    packages,
  });
  repository.subscriptions.push(subscriptionFixture(repository));
  const service = new SubscriptionsService(repository);
  const changed = await service.changeSubscriptionPackage(
    subscriptionId,
    { packageId: secondPackageId, reason: 'Upgrade' },
    actor(),
  );
  const event = changed.history[0];
  assert.equal(event.type, SubscriptionHistoryType.PACKAGE_CHANGED);
  assert.equal(event.metadata.previousPackage.name, 'Fiber 25');
  assert.equal(event.metadata.currentPackage.name, 'Fiber 50');
  packages[0].name = 'Edited old package';
  packages[1].name = 'Edited new package';
  assert.equal(event.metadata.previousPackage.name, 'Fiber 25');
  assert.equal(event.metadata.currentPackage.name, 'Fiber 50');
});

test('activation and cancellation create lifecycle history and preserve terminal state', async () => {
  const repository = new FakeSubscriptionsRepository({
    customers: [{ id: customerId, userId }],
    packages: [packageRecord()],
  });
  repository.subscriptions.push(subscriptionFixture(repository));
  const service = new SubscriptionsService(repository);
  const admin = actor({ sub: otherUserId, role: Role.ADMIN });
  const active = await service.activateSubscription(subscriptionId, admin);
  assert.equal(active.status, SubscriptionStatus.ACTIVE);
  assert.equal(active.history[0].metadata.event, 'ACTIVATED');
  const cancelled = await service.cancelSubscription(
    subscriptionId,
    'Requested',
    actor(),
  );
  assert.equal(cancelled.status, SubscriptionStatus.CANCELLED);
  assert.equal(cancelled.history[1].type, SubscriptionHistoryType.CANCELLED);
  await assert.rejects(
    () =>
      service.changeSubscriptionPackage(
        subscriptionId,
        { packageId: secondPackageId },
        actor(),
      ),
    ConflictException,
  );
});

test('subscription ownership and route guards reject unauthorized mutations', async () => {
  const repository = new FakeSubscriptionsRepository({
    customers: [{ id: customerId, userId }],
    packages: [packageRecord()],
  });
  repository.subscriptions.push(subscriptionFixture(repository));
  const service = new SubscriptionsService(repository);
  await assert.rejects(
    () =>
      service.getSubscriptionById(subscriptionId, actor({ sub: otherUserId })),
    ForbiddenException,
  );
  await assert.rejects(
    () => service.activateSubscription(subscriptionId, actor()),
    ForbiddenException,
  );
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PackagesController), [
    JwtAuthGuard,
    RolesGuard,
  ]);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, PackagesController.prototype.create),
    [Role.ADMIN],
  );
  assert.deepEqual(
    Reflect.getMetadata(GUARDS_METADATA, SubscriptionsController),
    [JwtAuthGuard, RolesGuard],
  );
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, SubscriptionsController.prototype.activate),
    [Role.ADMIN],
  );
});
