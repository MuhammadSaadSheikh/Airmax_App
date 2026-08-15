import { mockAdminInvoices, mockAdminPayments } from './billing.mock';
import type {
  ApiBillingEventType,
  ApiPaymentMethod,
  ApiPaymentStatus,
  BillingSummaryDto,
  InvoiceDto,
  MarkInvoicePaidInput,
  PaymentDto,
  PaymentMethod,
  PaymentStatus,
  RecordPaymentInput,
} from './billing.models';

let invoicesState = cloneInvoices(mockAdminInvoices);
let paymentsState = clonePayments(mockAdminPayments);
let nextPaymentNumber = 1;

function cloneInvoice(invoice: InvoiceDto): InvoiceDto {
  return {
    ...invoice,
    customer: { ...invoice.customer },
    subscription: { ...invoice.subscription },
    timeline: invoice.timeline.map(event => ({ ...event })),
  };
}

function cloneInvoices(invoices: InvoiceDto[]): InvoiceDto[] {
  return invoices.map(cloneInvoice);
}

function clonePayment(payment: PaymentDto): PaymentDto {
  return { ...payment, customer: { ...payment.customer } };
}

function clonePayments(payments: PaymentDto[]): PaymentDto[] {
  return payments.map(clonePayment);
}

function invoiceIndex(id: string): number {
  const index = invoicesState.findIndex(invoice => invoice.id === id);
  if (index < 0) throw new Error('Invoice not found');
  return index;
}

function mutableInvoice(id: string): [number, InvoiceDto] {
  const index = invoiceIndex(id);
  return [index, invoicesState[index]!];
}

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function paymentStatus(status: PaymentStatus): ApiPaymentStatus {
  return status.toUpperCase() as ApiPaymentStatus;
}

function paymentMethod(method: PaymentMethod): ApiPaymentMethod {
  return method.toUpperCase() as ApiPaymentMethod;
}

function timelineEvent(
  invoice: InvoiceDto,
  type: ApiBillingEventType,
  note: string | null,
  createdAt: string,
): InvoiceDto['timeline'][number] {
  return {
    id: `event-${invoice.id}-${invoice.timeline.length + 1}`,
    invoiceId: invoice.id,
    type,
    note,
    createdAt,
  };
}

function nextPaymentId(): { id: string; reference: string } {
  const sequence = nextPaymentNumber.toString().padStart(4, '0');
  nextPaymentNumber += 1;
  return {
    id: `mock-payment-${sequence}`,
    reference: `AMX-PAY-MOCK-${sequence}`,
  };
}

function assertPayable(invoice: InvoiceDto) {
  if (invoice.status !== 'PENDING' && invoice.status !== 'OVERDUE') {
    throw new Error('Only pending or overdue invoices can be paid');
  }
}

function markPaid(
  input: MarkInvoicePaidInput,
  eventType: 'MARKED_PAID' | 'PAYMENT_RECEIVED',
  note: string,
  timestamp: string,
): InvoiceDto {
  const [index, invoice] = mutableInvoice(input.invoiceId);
  assertPayable(invoice);
  const updated: InvoiceDto = {
    ...invoice,
    status: 'PAID',
    paidAt: timestamp,
    updatedAt: timestamp,
    timeline: [
      ...invoice.timeline,
      timelineEvent(invoice, eventType, note, timestamp),
    ],
  };
  invoicesState[index] = updated;
  return cloneInvoice(updated);
}

export const mockBillingRepository = {
  listInvoices(): InvoiceDto[] {
    return cloneInvoices(invoicesState);
  },

  getInvoiceById(id: string): InvoiceDto | undefined {
    const invoice = invoicesState.find(item => item.id === id);
    return invoice ? cloneInvoice(invoice) : undefined;
  },

  getCustomerInvoices(customerId: string): InvoiceDto[] {
    return cloneInvoices(
      invoicesState.filter(invoice => invoice.customerId === customerId),
    );
  },

  listPayments(): PaymentDto[] {
    return clonePayments(paymentsState);
  },

  getPaymentById(id: string): PaymentDto | undefined {
    const payment = paymentsState.find(item => item.id === id);
    return payment ? clonePayment(payment) : undefined;
  },

  getInvoicePayments(invoiceId: string): PaymentDto[] {
    invoiceIndex(invoiceId);
    return clonePayments(
      paymentsState.filter(payment => payment.invoiceId === invoiceId),
    );
  },

  recordPayment(input: RecordPaymentInput): PaymentDto {
    const [, invoice] = mutableInvoice(input.invoiceId);
    const amount = input.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }
    const status = input.status ?? 'successful';
    assertPayable(invoice);
    if (status === 'successful') {
      if (amount !== numericValue(invoice.amount)) {
        throw new Error('Successful payment must match the invoice amount');
      }
    }
    const timestamp = new Date().toISOString();
    const identity = nextPaymentId();
    const payment: PaymentDto = {
      ...identity,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: { ...invoice.customer },
      amount,
      currency: 'PKR',
      method: paymentMethod(input.method),
      status: paymentStatus(status),
      failureReason:
        status === 'failed'
          ? input.failureReason?.trim() || 'Payment attempt failed'
          : null,
      createdAt: timestamp,
      processedAt: status === 'pending' ? null : timestamp,
    };
    paymentsState = [...paymentsState, payment];

    if (status === 'successful') {
      markPaid(
        { invoiceId: invoice.id },
        'PAYMENT_RECEIVED',
        `Payment ${payment.reference} received`,
        timestamp,
      );
    } else {
      const index = invoiceIndex(invoice.id);
      const eventType = status === 'failed' ? 'PAYMENT_FAILED' : 'CREATED';
      invoicesState[index] = {
        ...invoice,
        updatedAt: timestamp,
        timeline: [
          ...invoice.timeline,
          timelineEvent(
            invoice,
            eventType,
            status === 'failed'
              ? `Payment ${payment.reference} failed`
              : `Payment ${payment.reference} is pending`,
            timestamp,
          ),
        ],
      };
    }
    return clonePayment(payment);
  },

  markInvoicePaid(input: MarkInvoicePaidInput): InvoiceDto {
    return markPaid(
      input,
      'MARKED_PAID',
      'Invoice manually marked as paid',
      new Date().toISOString(),
    );
  },

  cancelInvoice(invoiceId: string): InvoiceDto {
    const [index, invoice] = mutableInvoice(invoiceId);
    if (invoice.status !== 'PENDING') {
      throw new Error('Only pending invoices can be cancelled');
    }
    const timestamp = new Date().toISOString();
    const updated: InvoiceDto = {
      ...invoice,
      status: 'CANCELLED',
      cancelledAt: timestamp,
      updatedAt: timestamp,
      timeline: [
        ...invoice.timeline,
        timelineEvent(invoice, 'CANCELLED', 'Invoice cancelled', timestamp),
      ],
    };
    invoicesState[index] = updated;
    return cloneInvoice(updated);
  },

  getSummary(): BillingSummaryDto {
    return {
      totalRevenue: invoicesState
        .filter(invoice => invoice.status !== 'CANCELLED')
        .reduce((total, invoice) => total + numericValue(invoice.amount), 0),
      collectedPayments: paymentsState
        .filter(payment => payment.status === 'SUCCESSFUL')
        .reduce((total, payment) => total + numericValue(payment.amount), 0),
      pendingPayments: invoicesState
        .filter(invoice => invoice.status === 'PENDING')
        .reduce((total, invoice) => total + numericValue(invoice.amount), 0),
      overdueAmount: invoicesState
        .filter(invoice => invoice.status === 'OVERDUE')
        .reduce((total, invoice) => total + numericValue(invoice.amount), 0),
    };
  },

  reset(): void {
    invoicesState = cloneInvoices(mockAdminInvoices);
    paymentsState = clonePayments(mockAdminPayments);
    nextPaymentNumber = 1;
  },
};
