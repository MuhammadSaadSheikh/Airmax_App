import { apiRequest } from '../client';
import { mapPaymentDto } from './payment.mapper';
import type {
  InitiatePaymentInput,
  PaymentApiService,
  PaymentDto,
} from './payment.models';

export const livePaymentApiService: PaymentApiService = {
  async initiatePayment(input: InitiatePaymentInput) {
    const body = {
      invoiceId: input.invoiceId,
      paymentMethod: input.paymentMethod,
      ...(input.metadata ? { providerMetadata: input.metadata } : {}),
    };
    return mapPaymentDto(
      await apiRequest<PaymentDto>('/payments/initiate', {
        method: 'POST',
        headers: { 'Idempotency-Key': input.idempotencyKey },
        body: JSON.stringify(body),
      }),
    );
  },

  async getPaymentById(id: string) {
    return mapPaymentDto(
      await apiRequest<PaymentDto>(`/payments/${encodeURIComponent(id)}`),
    );
  },

  async getInvoicePayments(invoiceId: string) {
    const payments = await apiRequest<PaymentDto[]>(
      `/invoices/${encodeURIComponent(invoiceId)}/payments`,
    );
    return payments.map(mapPaymentDto);
  },
};
