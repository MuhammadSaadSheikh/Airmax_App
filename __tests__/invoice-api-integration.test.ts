const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { AuthorizationError, NetworkError } from '../src/services/api/errors';
import { liveInvoiceApiService } from '../src/services/api/invoice/invoice.live.service';
import {
  InvoiceContractError,
  mapInvoiceDto,
} from '../src/services/api/invoice/invoice.mapper';
import type { InvoiceDto } from '../src/services/api/invoice/invoice.models';

const invoiceDto: InvoiceDto = {
  id: '50000000-0000-4000-8000-000000000001',
  invoiceNumber: 'AMX-INV-0001',
  customerId: '20000000-0000-4000-8000-000000000001',
  subscriptionId: '30000000-0000-4000-8000-000000000001',
  amount: '2500.00',
  billingPeriod: 'MONTHLY',
  billingStart: '2026-08-01T00:00:00.000Z',
  billingEnd: '2026-09-01T00:00:00.000Z',
  dueDate: '2026-08-10T00:00:00.000Z',
  status: 'PENDING',
  customerName: 'Customer One',
  customerContact: '+923001234567',
  packageName: 'Fiber 25',
  packageSpeedMbps: 25,
  paidAt: null,
  cancelledAt: null,
  events: [
    {
      id: '70000000-0000-4000-8000-000000000001',
      type: 'GENERATED',
      actorId: null,
      previousStatus: null,
      currentStatus: 'GENERATED',
      metadata: { event: 'GENERATED' },
      occurredAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('Phase 4.4E production invoice API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches Customer-owned invoice history and maps immutable snapshots', async () => {
    mockApiRequest.mockResolvedValue([invoiceDto]);
    await expect(
      liveInvoiceApiService.getCustomerInvoices(invoiceDto.customerId),
    ).resolves.toEqual([
      expect.objectContaining({
        id: invoiceDto.id,
        customerId: invoiceDto.customerId,
        subscriptionId: invoiceDto.subscriptionId,
        packageName: 'Fiber 25',
        packageSpeedMbps: 25,
        amount: 2500,
        status: 'pending',
        items: [
          expect.objectContaining({
            description: 'Fiber 25 — monthly service',
            amount: 2500,
          }),
        ],
      }),
    ]);
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/customers/${invoiceDto.customerId}/invoices`,
    );
  });

  it('fetches invoice details without introducing User ownership', async () => {
    mockApiRequest.mockResolvedValue(invoiceDto);
    const invoice = await liveInvoiceApiService.getInvoiceById(invoiceDto.id);
    expect(invoice).toMatchObject({
      invoiceNumber: invoiceDto.invoiceNumber,
      billingStart: invoiceDto.billingStart,
      billingEnd: invoiceDto.billingEnd,
    });
    expect(invoice).not.toHaveProperty('userId');
    expect(mockApiRequest).toHaveBeenCalledWith(`/invoices/${invoiceDto.id}`);
  });

  it.each([
    ['GENERATED', 'pending'],
    ['PENDING', 'pending'],
    ['PAID', 'paid'],
    ['OVERDUE', 'overdue'],
    ['CANCELLED', 'cancelled'],
  ] as const)('maps %s invoice status to %s', (status, expected) => {
    expect(mapInvoiceDto({ ...invoiceDto, status }).status).toBe(expected);
  });

  it('rejects malformed invoice contracts instead of creating local fallback data', () => {
    expect(() => mapInvoiceDto({ ...invoiceDto, amount: 'invalid' })).toThrow(
      InvoiceContractError,
    );
  });

  it.each([
    new AuthorizationError('Invoice access denied', 403),
    new NetworkError('Offline', undefined),
  ])('preserves normalized API error %#', async error => {
    mockApiRequest.mockRejectedValue(error);
    await expect(
      liveInvoiceApiService.getInvoiceById(invoiceDto.id),
    ).rejects.toBe(error);
  });
});
