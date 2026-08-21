jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { billingCenterService } from '@/services/billing';
import { adminBillingService } from '@/services/api/billing.service';
import { mockBillingRepository } from '@/services/api/billing.mock.repository';
import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { mockSubscriptionRepository } from '@/services/api/subscriptions.mock.repository';
import { mockSystemRepository } from '@/services/api/mockSystem.repository';

describe('Phase 2D billing service', () => {
  it('returns a current bill with subscription summary', async () => {
    const current = await billingCenterService.getCurrentBill('AMX-1042');
    expect(current.invoice.amount).toBe(current.summary.currentAmount);
    expect(current.summary.daysRemaining).toBeGreaterThan(0);
  });
  it('returns invoices with line items', async () => {
    const invoices = await billingCenterService.getInvoices('AMX-1042');
    expect(invoices[0]?.items.length).toBeGreaterThan(0);
  });
  it('masks stored payment method details', async () => {
    const methods = await billingCenterService.getPaymentMethods('AMX-1042');
    expect(methods[0]?.detail).toContain('••••');
  });
  it('returns payment history and creates mock receipts', async () => {
    const history = await billingCenterService.getPaymentHistory('AMX-1042');
    const receipt = await billingCenterService.processPayment(
      'invoice-u1-2026-08',
      'card-4242',
    );
    expect(history[0]?.reference).toBeDefined();
    expect(receipt.reference).toMatch(/^AMX-PAY-/);
  });
});

describe('Phase 3D admin billing operations', () => {
  beforeEach(() => {
    mockSystemRepository.reset();
  });

  it('lists invoices with subscription snapshots and payment attempts', async () => {
    const invoices = await adminBillingService.getInvoices();

    expect(invoices.map(invoice => invoice.status)).toEqual([
      'paid',
      'pending',
      'overdue',
    ]);
    expect(invoices[0]).toEqual(
      expect.objectContaining({
        amount: 5000,
        currency: 'PKR',
        subscription: expect.objectContaining({ packageName: 'Air Plus' }),
      }),
    );
  });

  it('returns invoice detail and customer invoice relationships', async () => {
    const invoice =
      await adminBillingService.getInvoiceById('invoice-u1-2026-08');
    const customerInvoices = await adminBillingService.getCustomerInvoices(
      invoice.customer.id,
    );

    expect(invoice.invoiceNumber).toBe('AMX-INV-2608-1042');
    expect(customerInvoices).toContainEqual(invoice);
  });

  it('lists successful, pending and failed payment history', async () => {
    const payments = await adminBillingService.getPayments();

    expect(payments.map(payment => payment.status)).toEqual([
      'successful',
      'pending',
      'failed',
    ]);
    await expect(
      adminBillingService.getPaymentById('payment-2608-003'),
    ).resolves.toEqual(
      expect.objectContaining({
        invoiceId: 'invoice-u3-2026-08',
        failureReason: 'Payment authorization declined',
      }),
    );
  });

  it('records an immutable successful payment and settles its invoice', async () => {
    const payment = await adminBillingService.recordPayment({
      invoiceId: 'invoice-u1-2026-08',
      amount: 7000,
      method: 'cash',
    });
    const invoice =
      await adminBillingService.getInvoiceById('invoice-u1-2026-08');

    expect(payment).toEqual(
      expect.objectContaining({
        id: 'mock-payment-0001',
        reference: 'AMX-PAY-MOCK-0001',
        status: 'successful',
      }),
    );
    expect(invoice.status).toBe('paid');
    expect(invoice.payments).toContainEqual(payment);
    expect(invoice.timeline.at(-1)?.type).toBe('payment_received');
  });

  it('marks an overdue invoice paid without fabricating a payment', async () => {
    const before = await adminBillingService.getPayments();
    const invoice =
      await adminBillingService.markInvoicePaid('invoice-u3-2026-08');
    const after = await adminBillingService.getPayments();

    expect(invoice.status).toBe('paid');
    expect(invoice.timeline.at(-1)?.type).toBe('marked_paid');
    expect(after).toEqual(before);
  });

  it('cancels only pending invoices and enforces terminal states', async () => {
    const cancelled =
      await adminBillingService.cancelInvoice('invoice-u1-2026-08');

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.timeline.at(-1)?.type).toBe('cancelled');
    await expect(
      adminBillingService.markInvoicePaid(cancelled.id),
    ).rejects.toThrow('Only pending or overdue invoices can be paid');
    await expect(
      adminBillingService.cancelInvoice('invoice-u2-2026-08'),
    ).rejects.toThrow('Only pending invoices can be cancelled');
  });

  it('rejects invalid status transitions and payment amounts', async () => {
    await expect(
      adminBillingService.recordPayment({
        invoiceId: 'invoice-u2-2026-08',
        amount: 5000,
        method: 'card',
      }),
    ).rejects.toThrow('Only pending or overdue invoices can be paid');
    await expect(
      adminBillingService.recordPayment({
        invoiceId: 'invoice-u1-2026-08',
        amount: 100,
        method: 'cash',
      }),
    ).rejects.toThrow('must match the invoice amount');
  });

  it('preserves historical invoice snapshots after package changes', async () => {
    const before =
      await adminBillingService.getInvoiceById('invoice-u1-2026-08');
    mockSubscriptionRepository.changePackage(
      {
        subscriptionId: 'sub-u1',
        packageId: 'plus',
      },
      mockPackageRepository.getById('plus')!,
    );
    mockPackageRepository.update({
      packageId: 'premium',
      name: 'Premium',
      speedMbps: 125,
      price: 4200,
      durationDays: 30,
      description: 'Updated catalogue package',
      features: ['Updated feature'],
    });
    const after =
      await adminBillingService.getInvoiceById('invoice-u1-2026-08');

    expect(after.subscription).toEqual(before.subscription);
    expect(after.subscription).toEqual(
      expect.objectContaining({
        packageName: 'Premium',
        packageSpeedMbps: 100,
        packagePrice: 3500,
      }),
    );
  });

  it('keeps failed payments in immutable history', async () => {
    const payment = await adminBillingService.recordPayment({
      invoiceId: 'invoice-u1-2026-08',
      amount: 7000,
      method: 'card',
      status: 'failed',
      failureReason: 'Issuer declined',
    });
    payment.customer.name = 'Changed outside repository';
    const stored = await adminBillingService.getPaymentById(payment.id);

    expect(stored.status).toBe('failed');
    expect(stored.failureReason).toBe('Issuer declined');
    expect(stored.customer.name).toBe('Ahmed Khan');
  });

  it('prevents duplicate pending payment submissions and records the actor', () => {
    const first = mockBillingRepository.recordPayment({
      invoiceId: 'invoice-u3-2026-08',
      amount: 4500,
      method: 'card',
      status: 'pending',
      actorId: 'operator-1',
    });

    expect(first.actorId).toBe('operator-1');
    expect(() =>
      mockBillingRepository.recordPayment({
        invoiceId: 'invoice-u3-2026-08',
        amount: 4500,
        method: 'card',
        status: 'pending',
        actorId: 'operator-1',
      }),
    ).toThrow('pending payment attempt already exists');
  });

  it('returns defensive invoice copies', () => {
    const firstRead = mockBillingRepository.listInvoices();
    firstRead[0]!.customer.name = 'Changed outside repository';
    firstRead[0]!.subscription.packageName = 'Injected package';
    firstRead[0]!.timeline[0]!.note = 'Injected event';

    const secondRead = mockBillingRepository.listInvoices();
    expect(secondRead[0]!.customer.name).toBe('Sara Ali');
    expect(secondRead[0]!.subscription.packageName).toBe('Air Plus');
    expect(secondRead[0]!.timeline[0]!.note).toBeNull();
  });

  it('resets mutable state, summaries and deterministic IDs', () => {
    mockBillingRepository.recordPayment({
      invoiceId: 'invoice-u1-2026-08',
      amount: 7000,
      method: 'cash',
    });
    mockBillingRepository.reset();

    expect(mockBillingRepository.getInvoiceById('invoice-u1-2026-08')).toEqual(
      expect.objectContaining({ status: 'PENDING' }),
    );
    expect(
      mockBillingRepository.recordPayment({
        invoiceId: 'invoice-u1-2026-08',
        amount: 7000,
        method: 'cash',
      }).id,
    ).toBe('mock-payment-0001');
    expect(mockBillingRepository.getSummary()).toEqual({
      totalRevenue: 16500,
      collectedPayments: 12000,
      pendingPayments: 0,
      overdueAmount: 4500,
    });
  });

  it('rejects invalid invoice and payment identifiers', async () => {
    await expect(adminBillingService.getInvoiceById('missing')).rejects.toThrow(
      'Invoice not found',
    );
    await expect(adminBillingService.getPaymentById('missing')).rejects.toThrow(
      'Payment not found',
    );
  });
});
