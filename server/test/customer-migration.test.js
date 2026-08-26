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
const { CustomerStatus, Role } = require('@prisma/client');
const {
  CustomersController,
} = require('../dist/customers/customers.controller.js');
const { CustomersService } = require('../dist/customers/customers.service.js');
const {
  ChangeCustomerStatusDto,
  CreateCustomerDto,
  UpdateCustomerDto,
} = require('../dist/customers/dto/customer.dto.js');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');

const userId = '10000000-0000-4000-8000-000000000001';
const otherUserId = '10000000-0000-4000-8000-000000000002';
const customerId = '20000000-0000-4000-8000-000000000001';
const now = new Date('2026-08-26T00:00:00.000Z');

function user(id = userId) {
  return { id, phone: '+923001234567', email: 'customer@example.com' };
}

function customer(overrides = {}) {
  return {
    id: customerId,
    userId,
    accountNumber: 'AMX-1001',
    name: 'Customer One',
    status: CustomerStatus.ACTIVE,
    billingAddress: 'Billing address',
    serviceAddress: 'Service address',
    cnic: null,
    connectionId: 'CONNECTION-1',
    installationDate: null,
    routerDetails: null,
    createdAt: now,
    updatedAt: now,
    user: user(),
    ...overrides,
  };
}

class FakeCustomersRepository {
  constructor({ users = [user()], customers = [] } = {}) {
    this.users = users;
    this.customers = customers;
  }

  async findUserById(id) {
    return this.users.find(item => item.id === id) ?? null;
  }

  async findById(id) {
    return this.customers.find(item => item.id === id) ?? null;
  }

  async findByUserId(id) {
    return this.customers.find(item => item.userId === id) ?? null;
  }

  async create(data) {
    const record = customer({
      id: `20000000-0000-4000-8000-${String(this.customers.length + 1).padStart(12, '0')}`,
      ...data,
      userId: data.user.connect.id,
      user: this.users.find(item => item.id === data.user.connect.id),
      createdAt: now,
      updatedAt: now,
    });
    delete record.user.connect;
    this.customers.push(record);
    return record;
  }

  async update(id, data) {
    const record = await this.findById(id);
    if (!record) throw new Error('Customer not found');
    Object.assign(record, data, { updatedAt: now });
    return record;
  }
}

const customerActor = {
  sub: userId,
  role: Role.CUSTOMER,
  phone: '+923001234567',
  tokenType: 'access',
  jti: 'customer-jti',
};
const adminActor = { ...customerActor, sub: otherUserId, role: Role.ADMIN };

test('customer DTOs enforce required identity linkage and status contracts', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const created = await pipe.transform(
    { userId, accountNumber: 'AMX-1001', name: 'Customer One' },
    { type: 'body', metatype: CreateCustomerDto },
  );
  assert.equal(created.userId, userId);

  await assert.rejects(() =>
    pipe.transform(
      { userId: 'not-a-uuid', accountNumber: '', name: '' },
      { type: 'body', metatype: CreateCustomerDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      { status: 'DELETED' },
      { type: 'body', metatype: ChangeCustomerStatusDto },
    ),
  );
});

test('create customer validates user and enforces one customer per user', async () => {
  const missing = new CustomersService(
    new FakeCustomersRepository({ users: [] }),
  );
  await assert.rejects(
    () =>
      missing.createCustomer({
        userId,
        accountNumber: 'AMX-1001',
        name: 'Customer One',
      }),
    NotFoundException,
  );

  const duplicate = new CustomersService(
    new FakeCustomersRepository({ customers: [customer()] }),
  );
  await assert.rejects(
    () =>
      duplicate.createCustomer({
        userId,
        accountNumber: 'AMX-1002',
        name: 'Duplicate',
      }),
    ConflictException,
  );

  const repository = new FakeCustomersRepository();
  const service = new CustomersService(repository);
  const created = await service.createCustomer({
    userId,
    accountNumber: 'AMX-1001',
    name: 'Customer One',
  });
  assert.equal(created.userId, userId);
  assert.equal(created.phone, user().phone);
  assert.equal('passwordHash' in created, false);
});

test('customers can read and update only their own profile while admins can read any', async () => {
  const repository = new FakeCustomersRepository({ customers: [customer()] });
  const service = new CustomersService(repository);

  assert.equal(
    (await service.getCustomerById(customerId, customerActor)).id,
    customerId,
  );
  assert.equal(
    (await service.getCustomerByUserId(userId, customerActor)).id,
    customerId,
  );
  assert.equal(
    (await service.getCustomerById(customerId, adminActor)).id,
    customerId,
  );

  await assert.rejects(
    () =>
      service.getCustomerById(customerId, {
        ...customerActor,
        sub: otherUserId,
      }),
    ForbiddenException,
  );

  const updated = await service.updateCustomer(
    customerId,
    { serviceAddress: 'Updated service address' },
    customerActor,
  );
  assert.equal(updated.serviceAddress, 'Updated service address');
});

test('customer status changes and missing lookups are explicit', async () => {
  const repository = new FakeCustomersRepository({ customers: [customer()] });
  const service = new CustomersService(repository);
  const suspended = await service.changeCustomerStatus(
    customerId,
    CustomerStatus.SUSPENDED,
    adminActor,
  );
  assert.equal(suspended.status, CustomerStatus.SUSPENDED);
  await assert.rejects(
    () =>
      service.changeCustomerStatus(
        customerId,
        CustomerStatus.ACTIVE,
        customerActor,
      ),
    ForbiddenException,
  );
  await assert.rejects(
    () => service.getCustomerById('missing', adminActor),
    NotFoundException,
  );
});

test('customer routes retain JWT protection and admin-only mutation boundaries', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, CustomersController);
  assert.deepEqual(guards, [JwtAuthGuard, RolesGuard]);
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, CustomersController.prototype.create),
    [Role.ADMIN],
  );
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, CustomersController.prototype.changeStatus),
    [Role.ADMIN],
  );
  assert.equal(
    Reflect.getMetadata(ROLES_KEY, CustomersController.prototype.update),
    undefined,
  );
  assert.ok(UpdateCustomerDto);
});
