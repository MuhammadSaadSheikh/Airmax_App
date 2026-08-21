jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { adminBillingService } from '@/services/api/billing.service';
import { complaintsService } from '@/services/api/complaints.service';
import { customersService } from '@/services/api/customers.service';
import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { reportsService } from '@/services/api/reports.service';
import { subscriptionsService } from '@/services/api/subscriptions.service';
import { mockSystemRepository } from '@/services/api/mockSystem.repository';
import { billingCenterService } from '@/services/billing';
import { supportService } from '@/services/support';

describe('connected Phase 3 workflow simulation', () => {
  beforeEach(() => mockSystemRepository.reset());

  it('connects customer creation, subscription assignment and invoice generation', async () => {
    const customer = await customersService.createCustomer({
      name: 'Integration Customer',
      phone: '+92 300 9000001',
      email: 'integration@example.com',
      address: 'Test service area',
      cnic: '42101-9000001-1',
      connectionId: 'AMX-INTEGRATION-1',
    });

    const subscription = await subscriptionsService.assignCustomerPackage({
      customerId: customer.id,
      packageId: 'basic',
    });
    const detail = await customersService.getById(customer.id);
    const invoices = await adminBillingService.getCustomerInvoices(customer.id);

    expect(detail.latestSubscription?.id).toBe(subscription.id);
    expect(invoices).toHaveLength(1);
    expect(invoices[0]?.subscription).toEqual(
      expect.objectContaining({
        id: subscription.id,
        packageName: 'Basic',
        packagePrice: 1500,
      }),
    );
  });

  it('makes a customer payment visible to admin billing', async () => {
    const invoices = await billingCenterService.getInvoices('AMX-1042');
    const pending = invoices.find(invoice => invoice.status === 'pending');
    expect(pending).toBeDefined();

    const receipt = await billingCenterService.processPayment(
      pending!.id,
      'card-4242',
    );
    const adminInvoice = await adminBillingService.getInvoiceById(pending!.id);
    const adminPayment = await adminBillingService.getPaymentById(
      receipt.transactionId,
    );

    expect(adminInvoice.status).toBe('paid');
    expect(adminPayment.reference).toBe(receipt.reference);
    expect(adminPayment.actorId).toBe('customer:u1');
  });

  it('makes a customer complaint visible to admin support', async () => {
    const created = await supportService.createComplaint('AMX-1042', {
      category: 'internet',
      title: 'Shared workflow complaint',
      description: 'This complaint must be visible in the admin queue.',
    });
    const adminComplaint = await complaintsService.getById(created.id);

    expect(adminComplaint.customer.name).toBe('Ahmed Khan');
    expect(adminComplaint.status).toBe('pending');
    expect(adminComplaint.description).toBe(created.description);
  });

  it('derives dashboard totals from current repository state', async () => {
    const before = await reportsService.getDashboardAnalytics();
    await billingCenterService.processPayment('invoice-u1-2026-08', 'bank');
    await supportService.createComplaint('AMX-1042', {
      category: 'router',
      title: 'Dashboard aggregation complaint',
      description: 'Open complaint used to validate live aggregation.',
    });
    const after = await reportsService.getDashboardAnalytics();

    expect(after.summary.currentMonthRevenue).toBe(
      before.summary.currentMonthRevenue + 7000,
    );
    expect(after.summary.pendingPayments).toBe(
      before.summary.pendingPayments - 7000,
    );
    expect(after.summary.openComplaints).toBe(
      before.summary.openComplaints + 1,
    );
  });

  it('preserves subscription and invoice snapshots after catalogue edits', async () => {
    const beforeSubscription =
      await subscriptionsService.getSubscriptionById('sub-u1');
    const beforeInvoice =
      await adminBillingService.getInvoiceById('invoice-u1-2026-08');
    mockPackageRepository.update({
      packageId: 'premium',
      name: 'Premium Renamed',
      speedMbps: 150,
      price: 4900,
      durationDays: 45,
      description: 'Updated catalogue definition',
      features: ['Updated catalogue feature'],
    });

    const afterSubscription =
      await subscriptionsService.getSubscriptionById('sub-u1');
    const afterInvoice =
      await adminBillingService.getInvoiceById('invoice-u1-2026-08');
    expect(afterSubscription.package).toEqual(beforeSubscription.package);
    expect(afterInvoice.subscription).toEqual(beforeInvoice.subscription);
  });
});
