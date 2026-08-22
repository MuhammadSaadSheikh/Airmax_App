jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import {
  adminAuditEvents,
  attachAdminAuditActor,
  createAdminPermissionsForRole,
} from '@/features/admin/security';
import { auditService } from '@/services/api/audit.service';
import { adminBillingService } from '@/services/api/billing.service';
import { complaintsService } from '@/services/api/complaints.service';
import { customersService } from '@/services/api/customers.service';
import { mockCustomerRepository } from '@/services/api/customers.mock.repository';
import { mockSystemRepository } from '@/services/api/mockSystem.repository';
import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { subscriptionsService } from '@/services/api/subscriptions.service';
import { techniciansService } from '@/services/api/technicians.service';

const actor = { id: 'admin-hardening', name: 'Hardening Admin' };

async function record(
  draft: ReturnType<
    | typeof adminAuditEvents.customerCreated
    | typeof adminAuditEvents.subscriptionChanged
    | typeof adminAuditEvents.paymentRecorded
    | typeof adminAuditEvents.complaintAssignment
    | typeof adminAuditEvents.workOrderChanged
  >,
) {
  return auditService.createAuditEvent(attachAdminAuditActor(draft, actor));
}

describe('Phase 3.9.3 production hardening', () => {
  beforeEach(() => mockSystemRepository.reset());

  it('uses Field Service as the only technician catalogue', async () => {
    const complaintOptions = await complaintsService.listTechnicians();
    const fieldTechnicians = await techniciansService.getTechnicians();

    expect(complaintOptions.map(item => item.id)).toEqual(
      fieldTechnicians.map(item => item.id),
    );
    expect(complaintOptions.map(item => item.name)).toEqual(
      fieldTechnicians.map(item => item.name),
    );
    expect(complaintOptions.find(item => item.id === 'tech-ali')).toMatchObject(
      {
        name: 'Ali Ahmed',
        areaName: 'Karachi Central',
      },
    );
  });

  it('completes the commercial workflow with snapshots and centralized audit metadata', async () => {
    const customer = await customersService.createCustomer({
      name: 'Production Simulation',
      phone: '+92 300 9900001',
      email: 'production-simulation@example.com',
      address: 'Karachi Central',
      cnic: '42101-9900001-1',
      connectionId: 'AMX-PRODUCTION-1',
    });
    await record(adminAuditEvents.customerCreated(customer.id, customer.name));
    const subscription = await subscriptionsService.assignCustomerPackage({
      customerId: customer.id,
      packageId: 'basic',
    });
    await record(
      adminAuditEvents.subscriptionChanged(
        subscription.id,
        'assigned',
        customer.id,
        subscription.package.id,
      ),
    );
    const invoice = (
      await adminBillingService.getCustomerInvoices(customer.id)
    )[0]!;
    const payment = await adminBillingService.recordPayment({
      invoiceId: invoice.id,
      amount: invoice.amount,
      method: 'cash',
      actorId: actor.id,
    });
    await record(
      adminAuditEvents.paymentRecorded(
        payment.id,
        payment.invoiceId,
        payment.amount,
        payment.method,
      ),
    );

    mockPackageRepository.update({
      packageId: 'basic',
      name: 'Basic Production Edit',
      speedMbps: 25,
      price: 1750,
      durationDays: 30,
      description: 'Catalogue mutation after invoicing',
      features: ['Updated catalogue only'],
    });

    const persistedInvoice = await adminBillingService.getInvoiceById(
      invoice.id,
    );
    const events = await auditService.getAuditEvents({
      actorId: actor.id,
    });
    expect(persistedInvoice).toMatchObject({
      status: 'paid',
      amount: 1500,
      subscription: { packageName: 'Basic', packagePrice: 1500 },
    });
    expect(events.map(event => event.action)).toEqual([
      'PAYMENT_RECORDED',
      'SUBSCRIPTION_ASSIGNED',
      'CUSTOMER_CREATED',
    ]);
    expect(() => mockSystemRepository.validate()).not.toThrow();
  });

  it('completes the complaint field-service workflow with auditable transitions', async () => {
    const assignment = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
      assignedBy: actor.id,
    });
    await record(
      adminAuditEvents.complaintAssignment(
        assignment.complaintId,
        assignment.technicianId,
        assignment.workOrder.id,
      ),
    );
    const accepted = await techniciansService.acceptWorkOrder(
      assignment.workOrder.id,
    );
    await record(
      adminAuditEvents.workOrderChanged(
        accepted.workOrder.id,
        'accept',
        accepted.complaintId,
        accepted.technicianId,
        accepted.workOrder.status,
      ),
    );
    const started = await techniciansService.startWorkOrder(
      assignment.workOrder.id,
    );
    await record(
      adminAuditEvents.workOrderChanged(
        started.workOrder.id,
        'start',
        started.complaintId,
        started.technicianId,
        started.workOrder.status,
      ),
    );
    const completed = await techniciansService.completeWorkOrder(
      assignment.workOrder.id,
    );
    await record(
      adminAuditEvents.workOrderChanged(
        completed.workOrder.id,
        'complete',
        completed.complaintId,
        completed.technicianId,
        completed.workOrder.status,
      ),
    );

    await expect(
      complaintsService.getById('complaint-2054'),
    ).resolves.toMatchObject({ status: 'resolved' });
    await expect(
      techniciansService.getTechnicianWorkload('tech-ali'),
    ).resolves.toMatchObject({ activeJobs: 0, completedJobs: 2 });
    const complaintAudit = await auditService.getEntityHistory(
      'COMPLAINT',
      'complaint-2054',
    );
    const workOrderAudit = await auditService.getEntityHistory(
      'WORK_ORDER',
      assignment.workOrder.id,
    );
    expect(complaintAudit).toEqual([
      expect.objectContaining({ action: 'COMPLAINT_TECHNICIAN_ASSIGNED' }),
    ]);
    expect(workOrderAudit.map(event => event.action)).toEqual([
      'WORK_ORDER_COMPLETED',
      'WORK_ORDER_STARTED',
      'WORK_ORDER_ACCEPTED',
    ]);
    expect(() => mockSystemRepository.validate()).not.toThrow();
  });

  it('defensively clones nested customer data and resets audit state', async () => {
    const customer = mockCustomerRepository.getById('u1')!;
    (customer.routerDetails as Record<string, unknown>).model = 'Changed';
    expect(
      (
        mockCustomerRepository.getById('u1')!.routerDetails as Record<
          string,
          unknown
        >
      ).model,
    ).toBe('Huawei HG8145V5');

    await record(adminAuditEvents.customerCreated('u1', 'Ahmed Khan'));
    expect(
      await auditService.getAuditEvents({ actorId: actor.id }),
    ).toHaveLength(1);
    mockSystemRepository.reset();
    expect(await auditService.getAuditEvents({ actorId: actor.id })).toEqual(
      [],
    );
  });

  it('maps future admin roles to least-privilege frontend capabilities', () => {
    const finance = createAdminPermissionsForRole('FINANCE');
    const support = createAdminPermissionsForRole('SUPPORT');
    const fieldManager = createAdminPermissionsForRole('TECHNICIAN_MANAGER');

    expect(finance).toMatchObject({ managePayments: true });
    expect(finance.edit).toContain('billing');
    expect(finance.edit).not.toContain('complaints');
    expect(support.edit).toContain('complaints');
    expect(support.managePayments).toBe(false);
    expect(fieldManager.edit).toEqual(
      expect.arrayContaining(['complaints', 'technicians']),
    );
    expect(fieldManager.edit).not.toContain('billing');
  });
});
