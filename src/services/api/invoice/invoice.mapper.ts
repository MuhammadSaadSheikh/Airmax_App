import { ValidationError } from '../errors';
import type {
  InvoiceBillingPeriodDto,
  InvoiceDto,
  InvoiceStatusDto,
} from './invoice.models';
import type {
  BillingStatus,
  Invoice,
  InvoiceBillingPeriod,
} from '@/services/billing/models';

export class InvoiceContractError extends ValidationError {
  constructor(field: string) {
    super(`Invalid invoice response field: ${field}`, 502);
    this.name = 'InvoiceContractError';
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvoiceContractError(field);
  }
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new InvoiceContractError(field);
  return value || null;
}

function numericValue(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new InvoiceContractError(field);
  }
  return parsed;
}

function invoiceStatus(status: InvoiceStatusDto): BillingStatus {
  switch (status) {
    case 'GENERATED':
    case 'PENDING':
      return 'pending';
    case 'PAID':
      return 'paid';
    case 'OVERDUE':
      return 'overdue';
    case 'CANCELLED':
      return 'cancelled';
    default:
      throw new InvoiceContractError('status');
  }
}

function billingPeriod(period: InvoiceBillingPeriodDto): InvoiceBillingPeriod {
  switch (period) {
    case 'MONTHLY':
      return 'monthly';
    case 'QUARTERLY':
      return 'quarterly';
    case 'SEMI_ANNUAL':
      return 'semi-annual';
    case 'ANNUAL':
      return 'annual';
    default:
      throw new InvoiceContractError('billingPeriod');
  }
}

export function mapInvoiceDto(invoice: InvoiceDto): Invoice {
  if (!invoice || typeof invoice !== 'object') {
    throw new InvoiceContractError('invoice');
  }
  if (!Array.isArray(invoice.events)) {
    throw new InvoiceContractError('events');
  }
  const amount = numericValue(invoice.amount, 'amount');
  const packageName = requiredString(invoice.packageName, 'packageName');
  const period = billingPeriod(invoice.billingPeriod);
  return {
    id: requiredString(invoice.id, 'id'),
    invoiceNumber: requiredString(invoice.invoiceNumber, 'invoiceNumber'),
    customerId: requiredString(invoice.customerId, 'customerId'),
    subscriptionId: requiredString(invoice.subscriptionId, 'subscriptionId'),
    amount,
    date: requiredString(invoice.createdAt, 'createdAt'),
    dueDate: requiredString(invoice.dueDate, 'dueDate'),
    status: invoiceStatus(invoice.status),
    billingPeriod: period,
    billingStart: requiredString(invoice.billingStart, 'billingStart'),
    billingEnd: requiredString(invoice.billingEnd, 'billingEnd'),
    customerName: requiredString(invoice.customerName, 'customerName'),
    customerContact: nullableString(invoice.customerContact, 'customerContact'),
    packageName,
    packageSpeedMbps: numericValue(
      invoice.packageSpeedMbps,
      'packageSpeedMbps',
    ),
    paidAt: nullableString(invoice.paidAt, 'paidAt'),
    cancelledAt: nullableString(invoice.cancelledAt, 'cancelledAt'),
    items: [
      {
        id: `${invoice.id}-service`,
        description: `${packageName} — ${period} service`,
        quantity: 1,
        amount,
      },
    ],
  };
}
