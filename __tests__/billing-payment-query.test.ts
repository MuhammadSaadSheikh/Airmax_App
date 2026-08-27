const mockGetCurrentBill = jest.fn();
const mockGetInvoices = jest.fn();
const mockGetInvoice = jest.fn();
const mockGetPaymentHistory = jest.fn();
const mockGetPaymentById = jest.fn();
const mockProcessPayment = jest.fn();

jest.mock('../src/services/billing/billingService', () => ({
  billingCenterService: {
    getCurrentBill: (...args: unknown[]) => mockGetCurrentBill(...args),
    getInvoices: (...args: unknown[]) => mockGetInvoices(...args),
    getInvoice: (...args: unknown[]) => mockGetInvoice(...args),
    getPaymentHistory: (...args: unknown[]) => mockGetPaymentHistory(...args),
    processPayment: (...args: unknown[]) => mockProcessPayment(...args),
  },
}));

jest.mock('../src/services/api/payment/payment.service', () => ({
  paymentApiService: {
    getPaymentById: (...args: unknown[]) => mockGetPaymentById(...args),
  },
}));

import { QueryClient } from '@tanstack/react-query';
import {
  currentBillQueryOptions,
  customerInvoicesQueryOptions,
  invalidateBillingQueries,
  invoiceDetailQueryOptions,
  paymentDetailQueryOptions,
  paymentHistoryQueryOptions,
} from '../src/services/billing/billingQueries';
import { billingCenterService } from '../src/services/billing/billingService';
import { queryKeys } from '../src/services/query/queryKeys';

const customerId = 'customer-1';
const invoiceId = 'invoice-1';
const invoice = { id: invoiceId, status: 'pending', amount: 2500 };
const payment = { id: 'payment-1', invoiceId, status: 'pending' };
const currentBill = { invoice, summary: { currentAmount: 2500 } };

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('Phase 4.4E billing and payment React Query integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentBill.mockResolvedValue(currentBill);
    mockGetInvoices.mockResolvedValue([invoice]);
    mockGetInvoice.mockResolvedValue(invoice);
    mockGetPaymentHistory.mockResolvedValue([payment]);
    mockGetPaymentById.mockResolvedValue(payment);
    mockProcessPayment.mockResolvedValue({
      transactionId: payment.id,
      invoiceId,
      status: 'pending',
    });
  });

  it('loads invoice list/detail and payment history/detail through query boundaries', async () => {
    const client = createQueryClient();
    await expect(
      client.fetchQuery(customerInvoicesQueryOptions(customerId)),
    ).resolves.toEqual([invoice]);
    await expect(
      client.fetchQuery(invoiceDetailQueryOptions(invoiceId)),
    ).resolves.toEqual(invoice);
    await expect(
      client.fetchQuery(paymentHistoryQueryOptions(customerId)),
    ).resolves.toEqual([payment]);
    await expect(
      client.fetchQuery(paymentDetailQueryOptions(payment.id)),
    ).resolves.toEqual(payment);
    expect(mockGetInvoices).toHaveBeenCalledWith(customerId);
    expect(mockGetPaymentHistory).toHaveBeenCalledWith(customerId);
    client.clear();
  });

  it('exposes query loading and failure without mock fallback authority', async () => {
    const client = createQueryClient();
    let rejectRequest!: (error: Error) => void;
    mockGetCurrentBill.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
    );
    const request = client.fetchQuery(currentBillQueryOptions(customerId));
    expect(
      client.getQueryState(queryKeys.currentBill(customerId))?.status,
    ).toBe('pending');
    const error = new Error('Billing unavailable');
    rejectRequest(error);
    await expect(request).rejects.toBe(error);
    client.clear();
  });

  it('invalidates invoice, payment, and dashboard caches after initiation', async () => {
    const client = createQueryClient();
    const connectionId = 'AMX-1';
    const keys = [
      queryKeys.currentBill(customerId),
      queryKeys.invoices(customerId),
      queryKeys.invoiceDetail(invoiceId),
      queryKeys.paymentHistory(customerId),
      queryKeys.paymentDetail(payment.id),
      queryKeys.customerDashboard(connectionId),
      queryKeys.bills,
    ];
    keys.forEach(key => client.setQueryData(key, {}));

    await billingCenterService.processPayment(invoiceId, 'bank');
    await invalidateBillingQueries(client, {
      customerId,
      invoiceId,
      connectionId,
    });

    keys.forEach(key => {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    });
    expect(mockProcessPayment).toHaveBeenCalledWith(invoiceId, 'bank');
    client.clear();
  });

  it('refetches invoice data after payment initiation invalidation', async () => {
    const client = createQueryClient();
    const options = customerInvoicesQueryOptions(customerId);
    await client.fetchQuery(options);
    await invalidateBillingQueries(client, { customerId, invoiceId });
    await client.fetchQuery(options);
    expect(mockGetInvoices).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
