import { mockAdminPayments } from './billing.mock';
import type {
  ApiPaymentMethod,
  ApiPaymentStatus,
  InvoiceDto,
  PaymentDto,
  PaymentMethod,
  PaymentStatus,
  RecordPaymentInput,
} from './billing.models';

let paymentsState = clonePayments(mockAdminPayments);
let nextPaymentNumber = 1;

function clonePayment(payment: PaymentDto): PaymentDto {
  return { ...payment, customer: { ...payment.customer } };
}

function clonePayments(payments: PaymentDto[]): PaymentDto[] {
  return payments.map(clonePayment);
}

function paymentStatus(status: PaymentStatus): ApiPaymentStatus {
  return status.toUpperCase() as ApiPaymentStatus;
}

function paymentMethod(method: PaymentMethod): ApiPaymentMethod {
  return method.toUpperCase() as ApiPaymentMethod;
}

export const mockPaymentRepository = {
  list(): PaymentDto[] {
    return clonePayments(paymentsState);
  },

  getById(id: string): PaymentDto | undefined {
    const payment = paymentsState.find(item => item.id === id);
    return payment ? clonePayment(payment) : undefined;
  },

  getByInvoiceId(invoiceId: string): PaymentDto[] {
    return clonePayments(
      paymentsState.filter(payment => payment.invoiceId === invoiceId),
    );
  },

  create(invoice: InvoiceDto, input: RecordPaymentInput): PaymentDto {
    const status = input.status ?? 'successful';
    if (
      status === 'pending' &&
      paymentsState.some(
        payment =>
          payment.invoiceId === invoice.id && payment.status === 'PENDING',
      )
    ) {
      throw new Error('A pending payment attempt already exists');
    }
    const sequence = nextPaymentNumber.toString().padStart(4, '0');
    nextPaymentNumber += 1;
    const timestamp = new Date().toISOString();
    const payment: PaymentDto = {
      id: `mock-payment-${sequence}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: { ...invoice.customer },
      amount: input.amount,
      currency: 'PKR',
      method: paymentMethod(input.method),
      status: paymentStatus(status),
      reference: `AMX-PAY-MOCK-${sequence}`,
      actorId: input.actorId?.trim() || 'admin-mock',
      failureReason:
        status === 'failed'
          ? input.failureReason?.trim() || 'Payment attempt failed'
          : null,
      createdAt: timestamp,
      processedAt: status === 'pending' ? null : timestamp,
    };
    paymentsState = [...paymentsState, payment];
    return clonePayment(payment);
  },

  reset(): void {
    paymentsState = clonePayments(mockAdminPayments);
    nextPaymentNumber = 1;
  },
};
