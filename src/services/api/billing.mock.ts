import { mockSubscriptions } from './subscriptions.mock';
import type {
  ApiInvoiceStatus,
  InvoiceDto,
  PaymentDto,
} from './billing.models';

type InvoiceSeed = {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  amount: number;
  status: ApiInvoiceStatus;
  dueDate: string;
  paidAt: string | null;
};

const invoiceSeeds: InvoiceSeed[] = [
  {
    id: 'invoice-u2-2026-08',
    invoiceNumber: 'AMX-INV-2608-1188',
    subscriptionId: 'sub-u2',
    amount: 5000,
    status: 'PAID',
    dueDate: '2026-08-10T23:59:59.000Z',
    paidAt: '2026-08-08T11:30:00.000Z',
  },
  {
    id: 'invoice-u1-2026-08',
    invoiceNumber: 'AMX-INV-2608-1042',
    subscriptionId: 'sub-u1',
    amount: 7000,
    status: 'PENDING',
    dueDate: '2026-08-25T23:59:59.000Z',
    paidAt: null,
  },
  {
    id: 'invoice-u3-2026-08',
    invoiceNumber: 'AMX-INV-2608-1204',
    subscriptionId: 'sub-u3',
    amount: 4500,
    status: 'OVERDUE',
    dueDate: '2026-08-05T23:59:59.000Z',
    paidAt: null,
  },
];

export const mockAdminInvoices: InvoiceDto[] = invoiceSeeds.map(seed => {
  const subscription = mockSubscriptions.find(
    item => item.id === seed.subscriptionId,
  );
  if (!subscription) throw new Error('Invalid mock invoice subscription');
  const createdAt = '2026-08-01T08:00:00.000Z';
  const timeline: InvoiceDto['timeline'] = [
    {
      id: `event-${seed.id}-1`,
      invoiceId: seed.id,
      type: 'CREATED',
      note: null,
      createdAt,
    },
    {
      id: `event-${seed.id}-2`,
      invoiceId: seed.id,
      type: 'GENERATED',
      note: 'August 2026 invoice generated',
      createdAt: '2026-08-01T08:01:00.000Z',
    },
  ];
  if (seed.status === 'OVERDUE') {
    timeline.push({
      id: `event-${seed.id}-3`,
      invoiceId: seed.id,
      type: 'OVERDUE',
      note: 'Invoice passed its payment due date',
      createdAt: '2026-08-06T00:00:00.000Z',
    });
  }
  if (seed.status === 'PAID' && seed.paidAt) {
    timeline.push({
      id: `event-${seed.id}-3`,
      invoiceId: seed.id,
      type: 'PAYMENT_RECEIVED',
      note: 'Payment received in full',
      createdAt: seed.paidAt,
    });
  }
  return {
    id: seed.id,
    invoiceNumber: seed.invoiceNumber,
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
    billingPeriodStart: '2026-08-01T00:00:00.000Z',
    billingPeriodEnd: '2026-08-31T23:59:59.000Z',
    amount: seed.amount,
    currency: 'PKR',
    status: seed.status,
    dueDate: seed.dueDate,
    timeline,
    createdAt,
    updatedAt: seed.paidAt ?? timeline.at(-1)!.createdAt,
    paidAt: seed.paidAt,
    cancelledAt: null,
  };
});

const customerForInvoice = (invoiceId: string) => {
  const invoice = mockAdminInvoices.find(item => item.id === invoiceId);
  if (!invoice) throw new Error('Invalid mock payment invoice');
  return invoice;
};

const paidInvoice = customerForInvoice('invoice-u2-2026-08');
const pendingInvoice = customerForInvoice('invoice-u1-2026-08');
const overdueInvoice = customerForInvoice('invoice-u3-2026-08');

export const mockAdminPayments: PaymentDto[] = [
  {
    id: 'payment-2608-001',
    invoiceId: paidInvoice.id,
    invoiceNumber: paidInvoice.invoiceNumber,
    customer: { ...paidInvoice.customer },
    amount: 5000,
    currency: 'PKR',
    method: 'BANK_TRANSFER',
    status: 'SUCCESSFUL',
    reference: 'AMX-PAY-2608-001',
    failureReason: null,
    createdAt: '2026-08-08T11:29:00.000Z',
    processedAt: '2026-08-08T11:30:00.000Z',
  },
  {
    id: 'payment-2608-002',
    invoiceId: pendingInvoice.id,
    invoiceNumber: pendingInvoice.invoiceNumber,
    customer: { ...pendingInvoice.customer },
    amount: 7000,
    currency: 'PKR',
    method: 'CARD',
    status: 'PENDING',
    reference: 'AMX-PAY-2608-002',
    failureReason: null,
    createdAt: '2026-08-12T09:00:00.000Z',
    processedAt: null,
  },
  {
    id: 'payment-2608-003',
    invoiceId: overdueInvoice.id,
    invoiceNumber: overdueInvoice.invoiceNumber,
    customer: { ...overdueInvoice.customer },
    amount: 4500,
    currency: 'PKR',
    method: 'EASYPAISA',
    status: 'FAILED',
    reference: 'AMX-PAY-2608-003',
    failureReason: 'Payment authorization declined',
    createdAt: '2026-08-04T14:20:00.000Z',
    processedAt: '2026-08-04T14:21:00.000Z',
  },
];
