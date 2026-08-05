import { billingCenterService } from '@/services/billing';

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
    const receipt = await billingCenterService.processPayment('AMX-2608-1042', 'card-4242');
    expect(history[0]?.reference).toBeDefined();
    expect(receipt.reference).toMatch(/^RCP-/);
  });
});
