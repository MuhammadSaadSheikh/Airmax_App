import { mockBillingRepository } from '@/services/api/billing.mock.repository';
import type {
  InvoiceDto,
  PaymentMethod as AdminPaymentMethod,
  PaymentDto,
} from '@/services/api/billing.models';
import { resolveMockCustomer } from '@/services/api/mockCustomerContext';
import type {
  BillingStatus,
  CurrentBillSnapshot,
  Invoice,
  Payment,
  PaymentMethod,
  PaymentReceipt,
} from './models';

export interface BillingService {
  getCurrentBill(connectionId: string): Promise<CurrentBillSnapshot>;
  getInvoices(connectionId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getPaymentHistory(connectionId: string): Promise<Payment[]>;
  getPaymentMethods(connectionId: string): Promise<PaymentMethod[]>;
  processPayment(invoiceId: string, methodId: string): Promise<PaymentReceipt>;
}

const methods: PaymentMethod[] = [
  {
    id: 'card-4242',
    type: 'card',
    name: 'Visa',
    detail: '•••• 4242',
    isDefault: true,
  },
  {
    id: 'wallet-8831',
    type: 'wallet',
    name: 'JazzCash',
    detail: '•••• 8831',
    isDefault: false,
  },
  {
    id: 'bank',
    type: 'bank',
    name: 'Bank transfer',
    detail: 'Secure account transfer',
    isDefault: false,
  },
];

const wait = (duration = 320) =>
  new Promise<void>(resolve => setTimeout(resolve, duration));

function invoiceStatus(invoice: InvoiceDto): BillingStatus {
  if (invoice.status === 'PAID') return 'paid';
  if (invoice.status === 'OVERDUE') return 'overdue';
  return 'pending';
}

function mapInvoice(invoice: InvoiceDto): Invoice {
  const amount = Number(invoice.amount);
  return {
    id: invoice.id,
    amount: Number.isFinite(amount) ? amount : 0,
    date: invoice.createdAt,
    dueDate: invoice.dueDate,
    status: invoiceStatus(invoice),
    items: [
      {
        id: `${invoice.id}-service`,
        description: `${invoice.subscription.packageName} — Monthly service`,
        quantity: 1,
        amount: Number.isFinite(amount) ? amount : 0,
      },
    ],
  };
}

function customerInvoices(customerId: string): InvoiceDto[] {
  return mockBillingRepository
    .getCustomerInvoices(customerId)
    .filter(invoice => invoice.status !== 'CANCELLED');
}

function mapPayment(payment: PaymentDto): Payment {
  const method = payment.method.toLowerCase().replace('_', ' ');
  return {
    id: payment.id,
    amount: Number(payment.amount),
    method,
    date: payment.createdAt,
    status:
      payment.status === 'SUCCESSFUL'
        ? 'completed'
        : (payment.status.toLowerCase() as Payment['status']),
    invoiceId: payment.invoiceId,
    reference: payment.reference,
  };
}

function adminMethod(methodId: string): AdminPaymentMethod {
  if (methodId.startsWith('card')) return 'card';
  if (methodId.startsWith('wallet')) return 'jazzcash';
  return 'bank_transfer';
}

export const billingCenterService: BillingService = {
  async getCurrentBill(connectionId) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    const current =
      customerInvoices(customer.id).find(
        invoice => invoice.status === 'PENDING' || invoice.status === 'OVERDUE',
      ) ?? customerInvoices(customer.id)[0];
    if (!current) throw new Error('Customer invoice not found');
    const mapped = mapInvoice(current);
    const dueTime = new Date(current.dueDate).getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil((dueTime - Date.now()) / 86_400_000),
    );
    return {
      invoice: mapped,
      summary: {
        currentAmount: mapped.status === 'paid' ? 0 : mapped.amount,
        dueDate: current.dueDate,
        status: mapped.status,
        nextBillingDate: current.billingPeriodEnd,
        daysRemaining,
        billingCycle: 'Monthly',
        packageName: current.subscription.packageName,
        renewalStatus: 'automatic',
      },
    };
  },

  async getInvoices(connectionId) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    return customerInvoices(customer.id).map(mapInvoice);
  },

  async getInvoice(id) {
    await wait();
    const invoice = mockBillingRepository.getInvoiceById(id);
    return invoice && invoice.status !== 'CANCELLED'
      ? mapInvoice(invoice)
      : undefined;
  },

  async getPaymentHistory(connectionId) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    const invoiceIds = new Set(
      mockBillingRepository
        .getCustomerInvoices(customer.id)
        .map(invoice => invoice.id),
    );
    return mockBillingRepository
      .listPayments()
      .filter(payment => invoiceIds.has(payment.invoiceId))
      .map(mapPayment);
  },

  async getPaymentMethods(connectionId) {
    resolveMockCustomer(connectionId);
    await wait();
    return methods.map(method => ({ ...method }));
  },

  async processPayment(invoiceId, methodId) {
    await wait(900);
    const invoice = mockBillingRepository.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    const payment = mockBillingRepository.recordPayment({
      invoiceId,
      amount: Number(invoice.amount),
      method: adminMethod(methodId),
      actorId: `customer:${invoice.customerId}`,
    });
    const method = methods.find(item => item.id === methodId) ?? methods[0]!;
    return {
      transactionId: payment.id,
      invoiceId,
      amount: Number(payment.amount),
      method: `${method.name} ${method.detail}`,
      paidAt: payment.processedAt ?? payment.createdAt,
      reference: payment.reference,
    };
  },
};
