const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { AuthorizationError, NetworkError } from '../src/services/api/errors';
import { livePaymentApiService } from '../src/services/api/payment/payment.live.service';
import { mapPaymentDto } from '../src/services/api/payment/payment.mapper';
import type { PaymentDto } from '../src/services/api/payment/payment.models';

const paymentDto: PaymentDto = {
  id: '60000000-0000-4000-8000-000000000001',
  invoiceId: '50000000-0000-4000-8000-000000000001',
  customerId: '20000000-0000-4000-8000-000000000001',
  amount: '2500.00',
  paymentMethod: 'BANK_TRANSFER',
  status: 'PENDING',
  externalReference: null,
  attempts: [
    {
      id: '80000000-0000-4000-8000-000000000001',
      status: 'PENDING',
      provider: null,
      providerReference: null,
      failureReason: null,
      metadata: { event: 'PAYMENT_INITIATED' },
      attemptedAt: '2026-08-27T00:00:00.000Z',
    },
  ],
  processedAt: null,
  refundedAt: null,
  createdAt: '2026-08-27T00:00:00.000Z',
  updatedAt: '2026-08-27T00:00:00.000Z',
};

describe('Phase 4.4E production payment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initiates customer payment with idempotency and no financial authority fields', async () => {
    mockApiRequest.mockResolvedValue(paymentDto);
    const payment = await livePaymentApiService.initiatePayment({
      invoiceId: paymentDto.invoiceId,
      paymentMethod: 'BANK_TRANSFER',
      idempotencyKey: 'mobile-payment-key-1',
      metadata: { channel: 'airmax-mobile' },
    });
    expect(payment).toMatchObject({
      id: paymentDto.id,
      invoiceId: paymentDto.invoiceId,
      customerId: paymentDto.customerId,
      amount: 2500,
      status: 'pending',
      attempts: [{ status: 'pending' }],
    });
    const [path, options] = mockApiRequest.mock.calls[0]!;
    expect(path).toBe('/payments/initiate');
    expect(options).toMatchObject({
      method: 'POST',
      headers: { 'Idempotency-Key': 'mobile-payment-key-1' },
    });
    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body).toEqual({
      invoiceId: paymentDto.invoiceId,
      paymentMethod: 'BANK_TRANSFER',
      providerMetadata: { channel: 'airmax-mobile' },
    });
    expect(body).not.toHaveProperty('amount');
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('invoicePaid');
  });

  it('fetches payment detail and invoice payment history', async () => {
    mockApiRequest
      .mockResolvedValueOnce(paymentDto)
      .mockResolvedValueOnce([paymentDto]);
    await expect(
      livePaymentApiService.getPaymentById(paymentDto.id),
    ).resolves.toMatchObject({ id: paymentDto.id, reference: paymentDto.id });
    await expect(
      livePaymentApiService.getInvoicePayments(paymentDto.invoiceId),
    ).resolves.toHaveLength(1);
    expect(mockApiRequest).toHaveBeenNthCalledWith(
      1,
      `/payments/${paymentDto.id}`,
    );
    expect(mockApiRequest).toHaveBeenNthCalledWith(
      2,
      `/invoices/${paymentDto.invoiceId}/payments`,
    );
  });

  it.each([
    ['SUCCESS', 'completed', 'completed'],
    ['PENDING', 'pending', 'pending'],
    ['FAILED', 'failed', 'failed'],
  ] as const)(
    'maps %s payment and attempt states without local settlement',
    (status, expectedPayment, expectedAttempt) => {
      const payment = mapPaymentDto({
        ...paymentDto,
        status,
        attempts: [{ ...paymentDto.attempts[0]!, status }],
      });
      expect(payment.status).toBe(expectedPayment);
      expect(payment.attempts[0]?.status).toBe(expectedAttempt);
    },
  );

  it('maps failed payment details and provider references from the backend', () => {
    const payment = mapPaymentDto({
      ...paymentDto,
      status: 'FAILED',
      externalReference: 'provider-ref-1',
      attempts: [
        {
          ...paymentDto.attempts[0]!,
          status: 'FAILED',
          provider: 'placeholder',
          providerReference: 'provider-ref-1',
          failureReason: 'Provider declined',
        },
      ],
    });
    expect(payment).toMatchObject({
      status: 'failed',
      reference: 'provider-ref-1',
      attempts: [
        {
          status: 'failed',
          providerReference: 'provider-ref-1',
          failureReason: 'Provider declined',
        },
      ],
    });
  });

  it.each([
    new AuthorizationError('Payment access denied', 403),
    new NetworkError('Offline', undefined),
  ])('preserves normalized API error %#', async error => {
    mockApiRequest.mockRejectedValue(error);
    await expect(
      livePaymentApiService.getPaymentById(paymentDto.id),
    ).rejects.toBe(error);
  });
});
