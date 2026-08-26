const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '..');
const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');
const migration = readFileSync(
  join(
    root,
    'prisma/migrations/20260826000000_production_database_foundation/migration.sql',
  ),
  'utf8',
);

function block(kind, name) {
  const match = schema.match(
    new RegExp(`${kind} ${name} \\{([\\s\\S]*?)\\n\\}`),
  );
  assert.ok(match, `${kind} ${name} must exist`);
  return match[1];
}

test('production domain models and history ledgers exist', () => {
  for (const model of [
    'User',
    'Customer',
    'Package',
    'Subscription',
    'SubscriptionHistory',
    'Invoice',
    'InvoiceEvent',
    'Payment',
    'PaymentAttempt',
    'Complaint',
    'ComplaintHistory',
    'Technician',
    'Skill',
    'TechnicianSkill',
    'ServiceArea',
    'TechnicianAssignment',
    'WorkOrder',
    'WorkOrderHistory',
    'AuditLog',
  ])
    assert.match(schema, new RegExp(`model ${model} \\{`));
});

test('identity and business ownership are separated one-to-zero-or-one', () => {
  assert.match(block('model', 'User'), /customer\s+Customer\?/);
  assert.match(
    block('model', 'Customer'),
    /userId\s+String\s+@unique\s+@db\.Uuid/,
  );
  for (const model of ['Subscription', 'Invoice', 'Payment', 'Complaint']) {
    assert.match(block('model', model), /customerId\s+String\s+@db\.Uuid/);
    assert.doesNotMatch(block('model', model), /userId\s+String/);
  }
  assert.doesNotMatch(
    block('model', 'Customer'),
    /passwordHash|email\s|phone\s/,
  );
});

test('frozen billing and work-order statuses are exact', () => {
  const invoice = block('enum', 'InvoiceStatus');
  assert.deepEqual(invoice.match(/\b[A-Z][A-Z_]+\b/g), [
    'GENERATED',
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ]);
  const payment = block('enum', 'PaymentStatus');
  assert.deepEqual(payment.match(/\b[A-Z][A-Z_]+\b/g), [
    'SUCCESS',
    'FAILED',
    'PENDING',
    'REFUNDED',
  ]);
  const workOrder = block('enum', 'WorkOrderStatus');
  assert.deepEqual(workOrder.match(/\b[A-Z][A-Z_]+\b/g), [
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]);
});

test('invoice stores immutable commercial snapshots', () => {
  const invoice = block('model', 'Invoice');
  for (const field of [
    'customerNameSnapshot',
    'customerPhoneSnapshot',
    'packageNameSnapshot',
    'packageSpeedSnapshot',
    'amount',
    'billingPeriod',
    'periodStart',
    'periodEnd',
    'dueAt',
  ])
    assert.match(invoice, new RegExp(`\\b${field}\\b`));
  assert.doesNotMatch(invoice, /packageId/);
});

test('operational ownership uses assignment and restrictive history foreign keys', () => {
  assert.doesNotMatch(block('model', 'Complaint'), /technicianId/);
  const assignment = block('model', 'TechnicianAssignment');
  assert.match(assignment, /complaintId/);
  assert.match(assignment, /technicianId/);
  for (const model of [
    'SubscriptionHistory',
    'InvoiceEvent',
    'PaymentAttempt',
    'ComplaintHistory',
    'WorkOrderHistory',
  ]) {
    assert.match(block('model', model), /onDelete: Restrict/);
  }
  assert.match(block('model', 'AuditLog'), /onDelete: SetNull/);
});

test('migration is clean-install-only and creates database foreign keys', () => {
  assert.match(migration, /AIRMAX_UNTRACKED_SCHEMA/);
  assert.match(
    migration,
    /FOREIGN KEY \("invoiceId"\) REFERENCES "Invoice"\("id"\) ON DELETE RESTRICT/,
  );
  assert.match(
    migration,
    /FOREIGN KEY \("complaintId"\) REFERENCES "Complaint"\("id"\) ON DELETE RESTRICT/,
  );
  assert.match(
    migration,
    /FOREIGN KEY \("technicianId"\) REFERENCES "Technician"\("id"\) ON DELETE RESTRICT/,
  );
});
