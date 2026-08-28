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
  ValidationPipe,
} = require('@nestjs/common');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const {
  ComplaintHistoryType,
  ComplaintPriority,
  ComplaintStatus,
  Role,
  TechnicianAssignmentStatus,
  TechnicianStatus,
  WorkOrderStatus,
} = require('@prisma/client');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const {
  ComplaintsController,
} = require('../dist/complaints/complaints.controller.js');
const {
  ComplaintsService,
} = require('../dist/complaints/complaints.service.js');
const {
  CreateComplaintDto,
  ComplaintResponseDto,
  UpdateComplaintStatusDto,
} = require('../dist/complaints/dto/complaint.dto.js');
const {
  TechniciansController,
} = require('../dist/technicians/technicians.controller.js');
const {
  TechniciansService,
} = require('../dist/technicians/technicians.service.js');
const {
  WorkOrdersController,
} = require('../dist/work-orders/work-orders.controller.js');
const {
  WorkOrdersService,
} = require('../dist/work-orders/work-orders.service.js');

const userId = '10000000-0000-4000-8000-000000000001';
const otherUserId = '10000000-0000-4000-8000-000000000002';
const adminId = '10000000-0000-4000-8000-000000000003';
const customerId = '20000000-0000-4000-8000-000000000001';
const complaintId = '30000000-0000-4000-8000-000000000001';
const technicianId = '40000000-0000-4000-8000-000000000001';
const workOrderId = '50000000-0000-4000-8000-000000000001';
const now = new Date('2026-08-26T00:00:00.000Z');
const actor = (overrides = {}) => ({
  sub: userId,
  role: Role.CUSTOMER,
  phone: '+923001234567',
  tokenType: 'access',
  jti: 'jti',
  ...overrides,
});
const admin = actor({ sub: adminId, role: Role.ADMIN });

function complaint(overrides = {}) {
  return {
    id: complaintId,
    ticketNumber: 1,
    customerId,
    category: 'Connectivity',
    title: 'No connectivity',
    priority: ComplaintPriority.MEDIUM,
    description: 'No signal',
    attachmentUrl: null,
    status: ComplaintStatus.PENDING,
    resolvedAt: null,
    closedAt: null,
    customer: { id: customerId, userId, name: 'Customer One' },
    history: [],
    assignments: [],
    workOrders: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeComplaintsRepository {
  constructor() {
    this.customers = [{ id: customerId, userId }];
    this.complaints = [];
    this.assignmentResult = null;
  }
  async findCustomerById(id) {
    return this.customers.find(item => item.id === id) ?? null;
  }
  async findCustomerByUserId(id) {
    return this.customers.find(item => item.userId === id) ?? null;
  }
  async findById(id) {
    return this.complaints.find(item => item.id === id) ?? null;
  }
  async findByCustomerId(id) {
    return this.complaints.filter(item => item.customerId === id);
  }
  async findTechnicianByComplaintId(id) {
    const record = await this.findById(id);
    if (!record) return null;
    return {
      customer: { userId: record.customer.userId },
      assignments: record.assignments
        .filter(item => item.status !== TechnicianAssignmentStatus.CANCELLED)
        .slice(-1)
        .map(item => ({ technician: item.technician })),
    };
  }
  async create(data) {
    const created = complaint({
      customerId: data.customer.connect.id,
      category: data.category,
      title: data.title,
      priority: data.priority ?? ComplaintPriority.MEDIUM,
      description: data.description,
      attachmentUrl: data.attachmentUrl ?? null,
      history: [
        {
          id: 'history-1',
          ...data.history.create,
          actorId: data.history.create.actor.connect.id,
          occurredAt: now,
        },
      ],
    });
    this.complaints.push(created);
    return created;
  }
  async updateStatus(id, expected, next, actorId, reason) {
    const record = await this.findById(id);
    if (!record || record.status !== expected) return null;
    record.history.push({
      type: ComplaintHistoryType.STATUS_CHANGED,
      actorId,
      previousStatus: expected,
      currentStatus: next,
      message: reason,
      metadata: { event: next },
      occurredAt: now,
    });
    record.status = next;
    if (next === ComplaintStatus.RESOLVED) record.resolvedAt = now;
    if (next === ComplaintStatus.CLOSED) record.closedAt = now;
    return record;
  }
  async assignTechnician(id, selectedTechnicianId, assignedById, notes) {
    if (this.assignmentResult) return { kind: this.assignmentResult };
    const record = await this.findById(id);
    if (!record) return { kind: 'complaint_missing' };
    const previous = record.assignments.at(-1);
    const assignment = {
      id: `assignment-${record.assignments.length + 1}`,
      technicianId: selectedTechnicianId,
      assignedById,
      status: 'ASSIGNED',
      notes,
    };
    record.assignments.push(assignment);
    record.status = ComplaintStatus.ASSIGNED;
    record.history.push({
      type: ComplaintHistoryType.ASSIGNMENT_CHANGED,
      actorId: assignedById,
      metadata: { event: previous ? 'REASSIGNED' : 'ASSIGNED' },
    });
    return {
      kind: previous ? 'reassigned' : 'assigned',
      complaint: record,
    };
  }
}

function technician(overrides = {}) {
  return {
    id: technicianId,
    employeeNumber: 'TECH-1',
    name: 'Field Engineer',
    phone: '+923009999999',
    serviceAreaId: '60000000-0000-4000-8000-000000000001',
    status: TechnicianStatus.AVAILABLE,
    serviceArea: { city: 'Karachi', name: 'Central', active: true },
    skills: [{ skill: { name: 'Fiber', active: true } }],
    _count: { assignments: 0, workOrders: 0 },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeTechniciansRepository {
  constructor(record = technician()) {
    this.record = record;
    this.activeWork = 0;
  }
  async findAll() {
    return [this.record];
  }
  async findById(id) {
    return id === this.record.id ? this.record : null;
  }
  async countActiveWork() {
    return this.activeWork;
  }
  async update(_id, data) {
    Object.assign(this.record, data);
    return this.record;
  }
}

function workOrder(status = WorkOrderStatus.ASSIGNED) {
  return {
    id: workOrderId,
    number: 'WO-1-ABC',
    complaintId,
    customerId,
    technicianId,
    assignmentId: '70000000-0000-4000-8000-000000000001',
    status,
    assignedAt: now,
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    notes: null,
    complaint: {
      id: complaintId,
      customerId,
      status: ComplaintStatus.ASSIGNED,
    },
    customer: { id: customerId, userId, name: 'Customer One' },
    technician: technician(),
    assignment: { id: 'assignment-1', assignedById: adminId },
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

class FakeWorkOrdersRepository {
  constructor(record = workOrder()) {
    this.record = record;
  }
  async findById(id) {
    return id === this.record.id ? this.record : null;
  }
  async transition(id, expected, next, actorId, notes) {
    const record = await this.findById(id);
    if (!record) return { kind: 'missing' };
    if (record.status !== expected)
      return { kind: 'changed', current: record.status };
    record.history.push({
      previousStatus: expected,
      currentStatus: next,
      actorId,
      note: notes,
    });
    record.status = next;
    return { kind: 'updated', workOrder: record };
  }
}

test('complaint DTOs reject invalid ownership and legacy statuses', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  await assert.rejects(() =>
    pipe.transform(
      { customerId: 'bad', category: '', description: '' },
      { type: 'body', metatype: CreateComplaintDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      { status: 'OPEN' },
      { type: 'body', metatype: UpdateComplaintStatusDto },
    ),
  );
});

test('complaint title is required for new writes and legacy null is returned safely', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const valid = await pipe.transform(
    {
      category: 'Connectivity',
      title: 'Intermittent fiber signal',
      priority: ComplaintPriority.MEDIUM,
      description: 'Signal drops every few minutes',
    },
    { type: 'body', metatype: CreateComplaintDto },
  );
  assert.equal(valid.title, 'Intermittent fiber signal');
  const legacyAdmin = await pipe.transform(
    {
      customerId,
      category: 'Connectivity',
      title: 'Customer reported outage',
      description: 'No signal',
    },
    { type: 'body', metatype: CreateComplaintDto },
  );
  assert.equal(legacyAdmin.priority, undefined);
  await assert.rejects(() =>
    pipe.transform(
      {
        category: 'Connectivity',
        title: 'Intermittent fiber signal',
        description: 'No signal',
      },
      { type: 'body', metatype: CreateComplaintDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      {
        category: 'Connectivity',
        priority: ComplaintPriority.MEDIUM,
        description: 'No signal',
      },
      { type: 'body', metatype: CreateComplaintDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      {
        customerId,
        category: 'Connectivity',
        title: 'No',
        priority: ComplaintPriority.MEDIUM,
        description: 'No signal',
      },
      { type: 'body', metatype: CreateComplaintDto },
    ),
  );
  await assert.rejects(() =>
    pipe.transform(
      {
        customerId,
        category: 'Connectivity',
        title: 'x'.repeat(151),
        priority: ComplaintPriority.MEDIUM,
        description: 'No signal',
      },
      { type: 'body', metatype: CreateComplaintDto },
    ),
  );
  const legacy = complaint({ title: null });
  assert.equal(new ComplaintResponseDto(legacy).title, null);
});

test('complaint creation is Customer-owned and appends created history', async () => {
  const repository = new FakeComplaintsRepository();
  const service = new ComplaintsService(repository);
  const created = await service.createComplaint(
    {
      category: 'Connectivity',
      title: 'No connectivity',
      priority: ComplaintPriority.MEDIUM,
      description: 'No signal',
    },
    actor(),
  );
  assert.equal(created.customerId, customerId);
  assert.equal(created.title, 'No connectivity');
  assert.equal(created.history[0].type, ComplaintHistoryType.CREATED);
  assert.equal(created.history[0].actorId, userId);
});

test('customer complaint creation derives ownership and rejects payload ownership', async () => {
  const repository = new FakeComplaintsRepository();
  const service = new ComplaintsService(repository);
  const input = {
    category: 'Connectivity',
    title: 'No connectivity',
    priority: ComplaintPriority.HIGH,
    description: 'No signal',
  };
  const created = await service.createComplaint(input, actor());
  assert.equal(created.customerId, customerId);

  await assert.rejects(
    () =>
      service.createComplaint(
        {
          ...input,
          customerId: '20000000-0000-4000-8000-000000000099',
        },
        actor(),
      ),
    ForbiddenException,
  );

  repository.customers = [];
  await assert.rejects(
    () => service.createComplaint(input, actor()),
    NotFoundException,
  );
});

test('admin complaint creation retains validated explicit customer ownership', async () => {
  const repository = new FakeComplaintsRepository();
  const service = new ComplaintsService(repository);
  const input = {
    category: 'Connectivity',
    title: 'Customer reported outage',
    priority: ComplaintPriority.HIGH,
    description: 'No signal',
  };
  const created = await service.createComplaint(
    { ...input, customerId },
    admin,
  );
  assert.equal(created.customerId, customerId);
  assert.equal(created.history[0].actorId, adminId);

  await assert.rejects(
    () => service.createComplaint(input, admin),
    BadRequestException,
  );
  await assert.rejects(
    () =>
      service.createComplaint(
        {
          ...input,
          customerId: '20000000-0000-4000-8000-000000000099',
        },
        admin,
      ),
    NotFoundException,
  );
});

test('customer complaint access rejects cross-customer reads', async () => {
  const repository = new FakeComplaintsRepository();
  repository.complaints.push(complaint());
  const service = new ComplaintsService(repository);
  await assert.rejects(
    () => service.getComplaintById(complaintId, actor({ sub: otherUserId })),
    ForbiddenException,
  );
  assert.equal(
    (await service.getComplaintById(complaintId, actor())).id,
    complaintId,
  );
  await assert.rejects(
    () =>
      service.getCustomerComplaints(customerId, actor({ sub: otherUserId })),
    ForbiddenException,
  );
});

test('assigned technician lookup is complaint-scoped and customer-safe', async () => {
  const repository = new FakeComplaintsRepository();
  repository.complaints.push(
    complaint({
      assignments: [
        {
          status: TechnicianAssignmentStatus.ASSIGNED,
          technician: technician(),
        },
      ],
    }),
  );
  const service = new ComplaintsService(repository);
  const visible = await service.getComplaintTechnician(complaintId, actor());
  assert.deepEqual(Object.keys(visible), [
    'id',
    'name',
    'status',
    'skills',
    'serviceArea',
  ]);
  assert.deepEqual(visible.skills, ['Fiber']);
  assert.deepEqual(visible.serviceArea, {
    city: 'Karachi',
    name: 'Central',
  });
  assert.equal(
    (await service.getComplaintTechnician(complaintId, admin)).id,
    technicianId,
  );
  await assert.rejects(
    () =>
      service.getComplaintTechnician(complaintId, actor({ sub: otherUserId })),
    ForbiddenException,
  );
});

test('assigned technician lookup rejects missing complaints and assignments', async () => {
  const repository = new FakeComplaintsRepository();
  const service = new ComplaintsService(repository);
  await assert.rejects(
    () => service.getComplaintTechnician(complaintId, actor()),
    NotFoundException,
  );
  repository.complaints.push(complaint());
  await assert.rejects(
    () => service.getComplaintTechnician(complaintId, actor()),
    NotFoundException,
  );
  repository.complaints[0].assignments.push({
    status: TechnicianAssignmentStatus.ASSIGNED,
    technician: null,
  });
  await assert.rejects(
    () => service.getComplaintTechnician(complaintId, actor()),
    NotFoundException,
  );
});

test('complaint lifecycle records status history and validates resolution', async () => {
  const repository = new FakeComplaintsRepository();
  repository.complaints.push(complaint({ status: ComplaintStatus.ASSIGNED }));
  const service = new ComplaintsService(repository);
  await service.updateComplaintStatus(
    complaintId,
    { status: ComplaintStatus.IN_PROGRESS },
    admin,
  );
  const resolved = await service.resolveComplaint(
    complaintId,
    'Signal restored',
    admin,
  );
  assert.equal(resolved.status, ComplaintStatus.RESOLVED);
  assert.equal(resolved.history.at(-1).metadata.event, 'RESOLVED');
  await assert.rejects(
    () => service.resolveComplaint(complaintId, undefined, admin),
    ConflictException,
  );
});

test('assignment requires admin, records actor, and distinguishes reassignment', async () => {
  const repository = new FakeComplaintsRepository();
  repository.complaints.push(complaint());
  const service = new ComplaintsService(repository);
  await assert.rejects(
    () => service.assignTechnician(complaintId, { technicianId }, actor()),
    ForbiddenException,
  );
  const assigned = await service.assignTechnician(
    complaintId,
    { technicianId, notes: 'Dispatch' },
    admin,
  );
  assert.equal(assigned.assignments[0].assignedById, adminId);
  await service.reassignTechnician(
    complaintId,
    { technicianId: '40000000-0000-4000-8000-000000000002' },
    admin,
  );
  assert.equal(assigned.history.at(-1).metadata.event, 'REASSIGNED');
});

test('unavailable technician and completed work rejection propagate atomically', async () => {
  const repository = new FakeComplaintsRepository();
  repository.complaints.push(complaint());
  const service = new ComplaintsService(repository);
  for (const result of ['technician_unavailable', 'work_completed']) {
    repository.assignmentResult = result;
    await assert.rejects(
      () => service.assignTechnician(complaintId, { technicianId }, admin),
      ConflictException,
    );
  }
  assert.equal(repository.complaints[0].assignments.length, 0);
});

test('technician listing includes shared area/skills and validates availability state', async () => {
  const repository = new FakeTechniciansRepository();
  const service = new TechniciansService(repository);
  const listed = await service.listTechnicians();
  assert.equal(listed[0].serviceArea.name, 'Central');
  assert.equal(listed[0].skills[0].skill.name, 'Fiber');
  assert.equal(
    (
      await service.updateTechnicianStatus(
        technicianId,
        TechnicianStatus.ON_LEAVE,
      )
    ).status,
    TechnicianStatus.ON_LEAVE,
  );
  repository.record.status = TechnicianStatus.BUSY;
  repository.activeWork = 1;
  await assert.rejects(
    () =>
      service.updateTechnicianStatus(technicianId, TechnicianStatus.OFFLINE),
    ConflictException,
  );
});

test('work order follows accept, start, complete sequence with history', async () => {
  const repository = new FakeWorkOrdersRepository();
  const service = new WorkOrdersService(repository);
  await service.acceptWorkOrder(workOrderId, 'Accepted', admin);
  await service.startWorkOrder(workOrderId, 'Travelled', admin);
  const completed = await service.completeWorkOrder(
    workOrderId,
    'Fixed',
    admin,
  );
  assert.equal(completed.status, WorkOrderStatus.COMPLETED);
  assert.deepEqual(
    completed.history.map(item => item.currentStatus),
    [
      WorkOrderStatus.ACCEPTED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.COMPLETED,
    ],
  );
});

test('work order read permits admin and owner with a customer-safe projection', async () => {
  const repository = new FakeWorkOrdersRepository();
  const service = new WorkOrdersService(repository);
  const visible = await service.getWorkOrderById(workOrderId, actor());
  assert.deepEqual(Object.keys(visible), [
    'id',
    'complaintId',
    'status',
    'technician',
    'assignedAt',
    'acceptedAt',
    'startedAt',
    'completedAt',
  ]);
  assert.deepEqual(Object.keys(visible.technician), ['id', 'name', 'status']);
  assert.equal(
    (await service.getWorkOrderById(workOrderId, admin)).id,
    workOrderId,
  );
  await assert.rejects(
    () => service.getWorkOrderById(workOrderId, actor({ sub: otherUserId })),
    ForbiddenException,
  );
  repository.record.complaint.customerId =
    '20000000-0000-4000-8000-000000000099';
  await assert.rejects(
    () => service.getWorkOrderById(workOrderId, actor()),
    ForbiddenException,
  );
});

test('work order read rejects missing records', async () => {
  const service = new WorkOrdersService(
    new FakeWorkOrdersRepository(workOrder()),
  );
  await assert.rejects(
    () =>
      service.getWorkOrderById('50000000-0000-4000-8000-000000000099', actor()),
    NotFoundException,
  );
});

test('work order cancel allows active states and terminal records are immutable', async () => {
  const repository = new FakeWorkOrdersRepository(
    workOrder(WorkOrderStatus.IN_PROGRESS),
  );
  const service = new WorkOrdersService(repository);
  const cancelled = await service.cancelWorkOrder(
    workOrderId,
    'Weather',
    admin,
  );
  assert.equal(cancelled.status, WorkOrderStatus.CANCELLED);
  await assert.rejects(
    () => service.startWorkOrder(workOrderId, undefined, admin),
    ConflictException,
  );
  await assert.rejects(
    () => service.cancelWorkOrder(workOrderId, undefined, admin),
    ConflictException,
  );
  await assert.rejects(
    () => service.acceptWorkOrder(workOrderId, undefined, actor()),
    ForbiddenException,
  );
});

test('controllers retain JWT/RBAC guards and admin mutation contracts', () => {
  for (const controller of [
    ComplaintsController,
    TechniciansController,
    WorkOrdersController,
  ]) {
    const guards = Reflect.getMetadata(GUARDS_METADATA, controller);
    assert.ok(guards.includes(JwtAuthGuard));
    assert.ok(guards.includes(RolesGuard));
  }
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, TechniciansController), [
    Role.ADMIN,
  ]);
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, WorkOrdersController), [
    Role.ADMIN,
  ]);
  assert.deepEqual(
    Reflect.getMetadata(
      ROLES_KEY,
      ComplaintsController.prototype.getTechnician,
    ),
    [Role.ADMIN, Role.CUSTOMER],
  );
  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, WorkOrdersController.prototype.getById),
    [Role.ADMIN, Role.CUSTOMER],
  );
  assert.deepEqual(
    Reflect.getMetadata(
      ROLES_KEY,
      ComplaintsController.prototype.assignTechnician,
    ),
    [Role.ADMIN],
  );
});

test('repositories use transactions for assignment/completion and require assignment actor', () => {
  const root = join(__dirname, '..', 'src');
  const complaints = readFileSync(
    join(root, 'complaints/complaints.repository.ts'),
    'utf8',
  );
  const workOrders = readFileSync(
    join(root, 'work-orders/work-orders.repository.ts'),
    'utf8',
  );
  assert.match(complaints, /\$transaction/);
  assert.match(complaints, /assignedById: string/);
  assert.match(complaints, /assignedById is required/);
  assert.match(complaints, /technicianAssignment\.create/);
  assert.match(complaints, /workOrder\.create/);
  assert.match(complaints, /complaintHistory/);
  assert.match(workOrders, /\$transaction/);
  assert.match(workOrders, /WorkOrderHistoryType\.STATUS_CHANGED/);
  assert.match(workOrders, /ComplaintHistoryType\.STATUS_CHANGED/);
});
