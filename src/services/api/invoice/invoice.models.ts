import type { Invoice } from '@/services/billing/models';

export type InvoiceStatusDto =
  'GENERATED' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type InvoiceBillingPeriodDto =
  'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type InvoiceEventTypeDto =
  'GENERATED' | 'MARKED_PAID' | 'CANCELLED' | 'STATUS_CHANGED';

export type InvoiceEventDto = {
  id: string;
  type: InvoiceEventTypeDto;
  actorId: string | null;
  previousStatus: InvoiceStatusDto | null;
  currentStatus: InvoiceStatusDto | null;
  metadata: unknown;
  occurredAt: string;
};

export type InvoiceDto = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId: string;
  amount: number | string;
  billingPeriod: InvoiceBillingPeriodDto;
  billingStart: string;
  billingEnd: string;
  dueDate: string;
  status: InvoiceStatusDto;
  customerName: string;
  customerContact: string | null;
  packageName: string;
  packageSpeedMbps: number;
  paidAt: string | null;
  cancelledAt: string | null;
  events: InvoiceEventDto[];
  createdAt: string;
  updatedAt: string;
};

export interface InvoiceApiService {
  getInvoiceById(id: string): Promise<Invoice | undefined>;
  getCustomerInvoices(customerId: string): Promise<Invoice[]>;
}
