import type {
  ApiBillingEventType,
  BillingSummaryDto,
  InvoiceDto,
  MarkInvoicePaidInput,
  PaymentDto,
  RecordPaymentInput,
} from './billing.models';
import { mockInvoiceRepository } from './invoices.mock.repository';
import { mockPaymentRepository } from './payments.mock.repository';
import type { SubscriptionDto } from './subscriptions.models';

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function invoice(id: string): InvoiceDto {
  const value = mockInvoiceRepository.getById(id);
  if (!value) throw new Error('Invoice not found');
  return value;
}

function assertPayable(value: InvoiceDto) {
  if (value.status !== 'PENDING' && value.status !== 'OVERDUE') {
    throw new Error('Only pending or overdue invoices can be paid');
  }
}

function event(
  value: InvoiceDto,
  type: ApiBillingEventType,
  note: string,
  timestamp: string,
): InvoiceDto['timeline'][number] {
  return {
    id: `event-${value.id}-${value.timeline.length + 1}`,
    invoiceId: value.id,
    type,
    note,
    createdAt: timestamp,
  };
}

function markPaid(
  value: InvoiceDto,
  type: 'MARKED_PAID' | 'PAYMENT_RECEIVED',
  note: string,
  timestamp: string,
): InvoiceDto {
  assertPayable(value);
  return mockInvoiceRepository.update({
    ...value,
    status: 'PAID',
    paidAt: timestamp,
    updatedAt: timestamp,
    timeline: [...value.timeline, event(value, type, note, timestamp)],
  });
}

export const mockBillingRepository = {
  listInvoices: () => mockInvoiceRepository.list(),
  getInvoiceById: (id: string) => mockInvoiceRepository.getById(id),
  getCustomerInvoices: (customerId: string) =>
    mockInvoiceRepository.getByCustomerId(customerId),
  listPayments: () => mockPaymentRepository.list(),
  getPaymentById: (id: string) => mockPaymentRepository.getById(id),

  getInvoicePayments(invoiceId: string): PaymentDto[] {
    invoice(invoiceId);
    return mockPaymentRepository.getByInvoiceId(invoiceId);
  },

  ensureInvoiceForSubscription(subscription: SubscriptionDto): InvoiceDto {
    return mockInvoiceRepository.ensureForSubscription(subscription);
  },

  recordPayment(input: RecordPaymentInput): PaymentDto {
    const current = invoice(input.invoiceId);
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }
    assertPayable(current);
    const status = input.status ?? 'successful';
    if (
      status === 'successful' &&
      input.amount !== numericValue(current.amount)
    ) {
      throw new Error('Successful payment must match the invoice amount');
    }
    const payment = mockPaymentRepository.create(current, input);
    const timestamp = payment.createdAt;
    if (status === 'successful') {
      markPaid(
        current,
        'PAYMENT_RECEIVED',
        `Payment ${payment.reference} received`,
        timestamp,
      );
    } else {
      const type = status === 'failed' ? 'PAYMENT_FAILED' : 'CREATED';
      mockInvoiceRepository.update({
        ...current,
        updatedAt: timestamp,
        timeline: [
          ...current.timeline,
          event(
            current,
            type,
            status === 'failed'
              ? `Payment ${payment.reference} failed`
              : `Payment ${payment.reference} is pending`,
            timestamp,
          ),
        ],
      });
    }
    return payment;
  },

  markInvoicePaid(input: MarkInvoicePaidInput): InvoiceDto {
    return markPaid(
      invoice(input.invoiceId),
      'MARKED_PAID',
      'Invoice manually marked as paid',
      new Date().toISOString(),
    );
  },

  cancelInvoice(invoiceId: string): InvoiceDto {
    const current = invoice(invoiceId);
    if (current.status !== 'PENDING') {
      throw new Error('Only pending invoices can be cancelled');
    }
    const timestamp = new Date().toISOString();
    return mockInvoiceRepository.update({
      ...current,
      status: 'CANCELLED',
      cancelledAt: timestamp,
      updatedAt: timestamp,
      timeline: [
        ...current.timeline,
        event(current, 'CANCELLED', 'Invoice cancelled', timestamp),
      ],
    });
  },

  getSummary(): BillingSummaryDto {
    const invoices = mockInvoiceRepository.list();
    const payments = mockPaymentRepository.list();
    return {
      totalRevenue: invoices
        .filter(item => item.status !== 'CANCELLED')
        .reduce((total, item) => total + numericValue(item.amount), 0),
      collectedPayments: payments
        .filter(item => item.status === 'SUCCESSFUL')
        .reduce((total, item) => total + numericValue(item.amount), 0),
      pendingPayments: invoices
        .filter(item => item.status === 'PENDING')
        .reduce((total, item) => total + numericValue(item.amount), 0),
      overdueAmount: invoices
        .filter(item => item.status === 'OVERDUE')
        .reduce((total, item) => total + numericValue(item.amount), 0),
    };
  },

  reset(): void {
    mockInvoiceRepository.reset();
    mockPaymentRepository.reset();
  },
};
