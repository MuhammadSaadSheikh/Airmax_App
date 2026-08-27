import { mockDelay } from '../client';
import { mockBillingRepository } from '../billing.mock.repository';
import type { PaymentDto as LegacyPaymentDto } from '../billing.models';
import { mapPaymentDto } from './payment.mapper';
import type {
  InitiatePaymentInput,
  PaymentApiService,
  PaymentAttemptStatusDto,
  PaymentDto,
  PaymentStatusDto,
} from './payment.models';

function productionStatus(
  status: LegacyPaymentDto['status'],
): PaymentStatusDto {
  return status === 'SUCCESSFUL' ? 'SUCCESS' : status;
}

function productionAttemptStatus(
  status: LegacyPaymentDto['status'],
): PaymentAttemptStatusDto {
  return status === 'SUCCESSFUL' ? 'SUCCESS' : status;
}

function productionDto(payment: LegacyPaymentDto): PaymentDto {
  const invoice = mockBillingRepository.getInvoiceById(payment.invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  return {
    id: payment.id,
    invoiceId: payment.invoiceId,
    customerId: invoice.customerId,
    amount: payment.amount,
    paymentMethod: payment.method,
    status: productionStatus(payment.status),
    externalReference: payment.reference,
    attempts: [
      {
        id: `${payment.id}-attempt`,
        status: productionAttemptStatus(payment.status),
        provider: 'mock',
        providerReference: payment.reference,
        failureReason: payment.failureReason,
        metadata: { event: 'MOCK_PAYMENT' },
        attemptedAt: payment.processedAt ?? payment.createdAt,
      },
    ],
    processedAt: payment.processedAt,
    refundedAt: null,
    createdAt: payment.createdAt,
    updatedAt: payment.processedAt ?? payment.createdAt,
  };
}

function mockPaymentMethod(method: string) {
  if (method === 'CARD') return 'card' as const;
  if (method === 'WALLET') return 'jazzcash' as const;
  return 'bank_transfer' as const;
}

export const mockPaymentApiService: PaymentApiService = {
  async initiatePayment(input: InitiatePaymentInput) {
    await mockDelay(900);
    const invoice = mockBillingRepository.getInvoiceById(input.invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    return mapPaymentDto(
      productionDto(
        mockBillingRepository.recordPayment({
          invoiceId: input.invoiceId,
          amount: Number(invoice.amount),
          method: mockPaymentMethod(input.paymentMethod),
          actorId: `customer:${invoice.customerId}`,
        }),
      ),
    );
  },

  async getPaymentById(id: string) {
    await mockDelay();
    const payment = mockBillingRepository.getPaymentById(id);
    return payment ? mapPaymentDto(productionDto(payment)) : undefined;
  },

  async getInvoicePayments(invoiceId: string) {
    await mockDelay();
    return mockBillingRepository
      .getInvoicePayments(invoiceId)
      .map(productionDto)
      .map(mapPaymentDto);
  },
};
