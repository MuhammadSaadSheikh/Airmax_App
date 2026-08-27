import { environment } from '@/config/environment';
import type {
  CurrentBillSnapshot,
  Invoice,
  Payment,
  PaymentMethod,
  PaymentReceipt,
} from './models';

export interface BillingService {
  getCurrentBill(customerReference: string): Promise<CurrentBillSnapshot>;
  getInvoices(customerReference: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getPaymentHistory(customerReference: string): Promise<Payment[]>;
  getPaymentMethods(customerReference: string): Promise<PaymentMethod[]>;
  processPayment(
    invoiceId: string,
    methodId: string,
    idempotencyKey?: string,
  ): Promise<PaymentReceipt>;
}

function loadBillingCenterService(): BillingService {
  if (environment.useMockApi) {
    // Mock financial repositories are initialized only in explicit mock mode.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./billing.mock.service')
      .mockBillingCenterService as BillingService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./billing.live.service')
    .liveBillingCenterService as BillingService;
}

export const billingCenterService = loadBillingCenterService();
