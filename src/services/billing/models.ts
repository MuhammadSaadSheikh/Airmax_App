export type BillingStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethodType = 'card' | 'wallet' | 'bank';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type InvoiceBillingPeriod =
  'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type PaymentAttemptStatus = 'completed' | 'pending' | 'failed';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  date: string;
  dueDate: string;
  status: BillingStatus;
  billingPeriod: InvoiceBillingPeriod;
  billingStart: string;
  billingEnd: string;
  customerName: string;
  customerContact: string | null;
  packageName: string;
  packageSpeedMbps: number;
  paidAt: string | null;
  cancelledAt: string | null;
  items: InvoiceItem[];
}

export interface PaymentAttempt {
  id: string;
  status: PaymentAttemptStatus;
  provider: string | null;
  providerReference: string | null;
  failureReason: string | null;
  attemptedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
  reference: string;
  externalReference: string | null;
  attempts: PaymentAttempt[];
  processedAt: string | null;
  refundedAt: string | null;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  detail: string;
  isDefault: boolean;
}

export interface BillingSummary {
  currentAmount: number;
  dueDate: string;
  status: BillingStatus;
  nextBillingDate: string;
  daysRemaining: number;
  billingCycle: string;
  packageName: string;
  renewalStatus: 'automatic' | 'manual';
}

export interface CurrentBillSnapshot {
  invoice: Invoice;
  summary: BillingSummary;
}

export interface PaymentReceipt {
  transactionId: string;
  invoiceId: string;
  amount: number;
  method: string;
  paidAt: string;
  reference: string;
  status: PaymentStatus;
}
