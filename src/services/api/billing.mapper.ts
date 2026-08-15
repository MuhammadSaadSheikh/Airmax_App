import type {
  AdminBillingSummary,
  AdminInvoice,
  AdminPayment,
  ApiBillingEventType,
  ApiInvoiceStatus,
  ApiPaymentMethod,
  ApiPaymentStatus,
  BillingEventType,
  BillingSummaryDto,
  InvoiceDto,
  InvoiceStatus,
  PaymentDto,
  PaymentMethod,
  PaymentStatus,
} from './billing.models';

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function mapInvoiceStatus(status: ApiInvoiceStatus): InvoiceStatus {
  switch (status) {
    case 'GENERATED':
      return 'generated';
    case 'PENDING':
      return 'pending';
    case 'PAID':
      return 'paid';
    case 'OVERDUE':
      return 'overdue';
    case 'CANCELLED':
      return 'cancelled';
  }
}

export function mapPaymentStatus(status: ApiPaymentStatus): PaymentStatus {
  switch (status) {
    case 'SUCCESSFUL':
      return 'successful';
    case 'PENDING':
      return 'pending';
    case 'FAILED':
      return 'failed';
  }
}

export function mapPaymentMethod(method: ApiPaymentMethod): PaymentMethod {
  return method.toLowerCase() as PaymentMethod;
}

function mapEventType(type: ApiBillingEventType): BillingEventType {
  return type.toLowerCase() as BillingEventType;
}

export function mapPayment(dto: PaymentDto): AdminPayment {
  return {
    id: dto.id,
    invoiceId: dto.invoiceId,
    invoiceNumber: dto.invoiceNumber,
    customer: { ...dto.customer },
    amount: numericValue(dto.amount),
    currency: dto.currency,
    method: mapPaymentMethod(dto.method),
    status: mapPaymentStatus(dto.status),
    reference: dto.reference,
    failureReason: dto.failureReason,
    createdAt: dto.createdAt,
    processedAt: dto.processedAt,
  };
}

export function mapInvoice(
  dto: InvoiceDto,
  payments: PaymentDto[],
): AdminInvoice {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    customer: { ...dto.customer },
    subscription: {
      ...dto.subscription,
      packagePrice: numericValue(dto.subscription.packagePrice),
    },
    billingPeriodStart: dto.billingPeriodStart,
    billingPeriodEnd: dto.billingPeriodEnd,
    amount: numericValue(dto.amount),
    currency: dto.currency,
    status: mapInvoiceStatus(dto.status),
    dueDate: dto.dueDate,
    payments: payments.map(mapPayment),
    timeline: dto.timeline.map(event => ({
      id: event.id,
      type: mapEventType(event.type),
      note: event.note,
      createdAt: event.createdAt,
    })),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    paidAt: dto.paidAt,
    cancelledAt: dto.cancelledAt,
  };
}

export function mapBillingSummary(dto: BillingSummaryDto): AdminBillingSummary {
  return {
    totalRevenue: numericValue(dto.totalRevenue),
    collectedPayments: numericValue(dto.collectedPayments),
    pendingPayments: numericValue(dto.pendingPayments),
    overdueAmount: numericValue(dto.overdueAmount),
  };
}
