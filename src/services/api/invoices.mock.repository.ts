import { mockAdminInvoices } from './billing.mock';
import type { InvoiceDto } from './billing.models';
import type { SubscriptionDto } from './subscriptions.models';

let invoicesState = cloneInvoices(mockAdminInvoices);
let nextInvoiceNumber = 1;

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

function invoiceIndex(id: string): number {
  const index = invoicesState.findIndex(invoice => invoice.id === id);
  if (index < 0) throw new Error('Invoice not found');
  return index;
}

export const mockInvoiceRepository = {
  list(): InvoiceDto[] {
    return cloneInvoices(invoicesState);
  },

  getById(id: string): InvoiceDto | undefined {
    const invoice = invoicesState.find(item => item.id === id);
    return invoice ? cloneInvoice(invoice) : undefined;
  },

  getByCustomerId(customerId: string): InvoiceDto[] {
    return cloneInvoices(
      invoicesState.filter(invoice => invoice.customerId === customerId),
    );
  },

  update(invoice: InvoiceDto): InvoiceDto {
    const index = invoiceIndex(invoice.id);
    invoicesState[index] = cloneInvoice(invoice);
    return cloneInvoice(invoice);
  },

  ensureForSubscription(subscription: SubscriptionDto): InvoiceDto {
    const existing = invoicesState.find(
      invoice => invoice.subscriptionId === subscription.id,
    );
    if (existing) return cloneInvoice(existing);

    const timestamp = new Date().toISOString();
    const sequence = nextInvoiceNumber.toString().padStart(4, '0');
    nextInvoiceNumber += 1;
    const amount = Number(subscription.package.price);
    const invoice: InvoiceDto = {
      id: `mock-invoice-${sequence}`,
      invoiceNumber: `AMX-INV-MOCK-${sequence}`,
      customerId: subscription.customer.id,
      subscriptionId: subscription.id,
      customer: { ...subscription.customer },
      subscription: {
        id: subscription.id,
        packageId: subscription.package.id,
        packageName: subscription.package.name,
        packageSpeedMbps: subscription.package.speedMbps,
        packagePrice: subscription.package.price,
      },
      billingPeriodStart: subscription.startsAt,
      billingPeriodEnd: subscription.expiresAt,
      amount: Number.isFinite(amount) ? amount : 0,
      currency: 'PKR',
      status: 'PENDING',
      dueDate: subscription.expiresAt,
      timeline: [
        {
          id: `event-mock-invoice-${sequence}-1`,
          invoiceId: `mock-invoice-${sequence}`,
          type: 'CREATED',
          note: 'Invoice created from subscription snapshot',
          createdAt: timestamp,
        },
        {
          id: `event-mock-invoice-${sequence}-2`,
          invoiceId: `mock-invoice-${sequence}`,
          type: 'GENERATED',
          note: `${subscription.package.name} subscription invoice generated`,
          createdAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
      paidAt: null,
      cancelledAt: null,
    };
    invoicesState = [...invoicesState, invoice];
    return cloneInvoice(invoice);
  },

  reset(): void {
    invoicesState = cloneInvoices(mockAdminInvoices);
    nextInvoiceNumber = 1;
  },
};
