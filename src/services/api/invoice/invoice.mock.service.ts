import { mockDelay } from '../client';
import { mockBillingRepository } from '../billing.mock.repository';
import type { InvoiceDto as LegacyInvoiceDto } from '../billing.models';
import { mapInvoiceDto } from './invoice.mapper';
import type {
  InvoiceApiService,
  InvoiceDto,
  InvoiceEventTypeDto,
} from './invoice.models';

function productionEventType(
  type: LegacyInvoiceDto['timeline'][number]['type'],
): InvoiceEventTypeDto {
  if (type === 'MARKED_PAID' || type === 'PAYMENT_RECEIVED') {
    return 'MARKED_PAID';
  }
  if (type === 'CANCELLED') return 'CANCELLED';
  if (type === 'GENERATED' || type === 'CREATED') return 'GENERATED';
  return 'STATUS_CHANGED';
}

function productionDto(invoice: LegacyInvoiceDto): InvoiceDto {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    subscriptionId: invoice.subscriptionId,
    amount: invoice.amount,
    billingPeriod: 'MONTHLY',
    billingStart: invoice.billingPeriodStart,
    billingEnd: invoice.billingPeriodEnd,
    dueDate: invoice.dueDate,
    status: invoice.status,
    customerName: invoice.customer.name,
    customerContact: invoice.customer.phone,
    packageName: invoice.subscription.packageName,
    packageSpeedMbps: invoice.subscription.packageSpeedMbps,
    paidAt: invoice.paidAt,
    cancelledAt: invoice.cancelledAt,
    events: invoice.timeline.map(event => ({
      id: event.id,
      type: productionEventType(event.type),
      actorId: null,
      previousStatus: null,
      currentStatus: invoice.status,
      metadata: event.note ? { note: event.note } : null,
      occurredAt: event.createdAt,
    })),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

export const mockInvoiceApiService: InvoiceApiService = {
  async getInvoiceById(id: string) {
    await mockDelay();
    const invoice = mockBillingRepository.getInvoiceById(id);
    return invoice ? mapInvoiceDto(productionDto(invoice)) : undefined;
  },

  async getCustomerInvoices(customerId: string) {
    await mockDelay();
    return mockBillingRepository
      .getCustomerInvoices(customerId)
      .map(productionDto)
      .map(mapInvoiceDto);
  },
};
