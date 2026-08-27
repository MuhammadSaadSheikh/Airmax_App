import type { InvoiceApiService } from '@/services/api/invoice/invoice.models';
import type { PaymentApiService } from '@/services/api/payment/payment.models';
import type { BillingService } from './billingService';
import type { PaymentMethod } from './models';

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

function paymentMethodCode(methodId: string): string {
  const method = methods.find(item => item.id === methodId);
  if (method?.type === 'card') return 'CARD';
  if (method?.type === 'wallet') return 'WALLET';
  return 'BANK_TRANSFER';
}

function billingCycleLabel(value: string): string {
  return value
    .split('-')
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function createPaymentIdempotencyKey(): string {
  return `mobile-payment-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

export function createBillingCenterService(
  invoices: InvoiceApiService,
  payments: PaymentApiService,
  resolveCustomerId: (reference: string) => string = reference => reference,
): BillingService {
  return {
    async getCurrentBill(customerReference) {
      const customerId = resolveCustomerId(customerReference);
      const customerInvoices = await invoices.getCustomerInvoices(customerId);
      const current =
        customerInvoices.find(
          invoice =>
            invoice.status === 'pending' || invoice.status === 'overdue',
        ) ?? customerInvoices.find(invoice => invoice.status !== 'cancelled');
      if (!current) throw new Error('Customer invoice not found');
      const dueTime = new Date(current.dueDate).getTime();
      const daysRemaining = Number.isFinite(dueTime)
        ? Math.max(0, Math.ceil((dueTime - Date.now()) / 86_400_000))
        : 0;
      return {
        invoice: current,
        summary: {
          currentAmount:
            current.status === 'pending' || current.status === 'overdue'
              ? current.amount
              : 0,
          dueDate: current.dueDate,
          status: current.status,
          nextBillingDate: current.billingEnd,
          daysRemaining,
          billingCycle: billingCycleLabel(current.billingPeriod),
          packageName: current.packageName,
          renewalStatus: 'automatic',
        },
      };
    },

    async getInvoices(customerReference) {
      return invoices.getCustomerInvoices(resolveCustomerId(customerReference));
    },

    async getInvoice(id) {
      return invoices.getInvoiceById(id);
    },

    async getPaymentHistory(customerReference) {
      const customerInvoices = await invoices.getCustomerInvoices(
        resolveCustomerId(customerReference),
      );
      const history = await Promise.all(
        customerInvoices.map(invoice =>
          payments.getInvoicePayments(invoice.id),
        ),
      );
      return history
        .flat()
        .sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        );
    },

    async getPaymentMethods() {
      return methods.map(method => ({ ...method }));
    },

    async processPayment(invoiceId, methodId, idempotencyKey) {
      const method = methods.find(item => item.id === methodId) ?? methods[0]!;
      const payment = await payments.initiatePayment({
        invoiceId,
        paymentMethod: paymentMethodCode(methodId),
        idempotencyKey: idempotencyKey ?? createPaymentIdempotencyKey(),
        metadata: { channel: 'airmax-mobile' },
      });
      return {
        transactionId: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        method: `${method.name} ${method.detail}`,
        paidAt: payment.processedAt ?? payment.date,
        reference: payment.reference,
        status: payment.status,
      };
    },
  };
}
