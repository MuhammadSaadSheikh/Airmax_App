import type { Payment } from '@/services/billing/models';

export type PaymentStatusDto = 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';

export type PaymentAttemptStatusDto = 'SUCCESS' | 'FAILED' | 'PENDING';

export type PaymentAttemptDto = {
  id: string;
  status: PaymentAttemptStatusDto;
  provider: string | null;
  providerReference: string | null;
  failureReason: string | null;
  metadata: unknown;
  attemptedAt: string;
};

export type PaymentDto = {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number | string;
  paymentMethod: string;
  status: PaymentStatusDto;
  externalReference: string | null;
  attempts: PaymentAttemptDto[];
  processedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InitiatePaymentInput = {
  invoiceId: string;
  paymentMethod: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export interface PaymentApiService {
  initiatePayment(input: InitiatePaymentInput): Promise<Payment>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  getInvoicePayments(invoiceId: string): Promise<Payment[]>;
}
