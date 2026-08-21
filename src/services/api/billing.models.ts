export type ApiInvoiceStatus =
  'GENERATED' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type ApiPaymentStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED';

export type ApiPaymentMethod =
  'CASH' | 'CARD' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH';

export type ApiBillingEventType =
  | 'CREATED'
  | 'GENERATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'MARKED_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceCustomerDto = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  connectionId: string | null;
};

export type InvoiceSubscriptionDto = {
  id: string;
  packageId: string;
  packageName: string;
  packageSpeedMbps: number;
  packagePrice: number | string;
};

export type BillingTimelineEventDto = {
  id: string;
  invoiceId: string;
  type: ApiBillingEventType;
  note: string | null;
  createdAt: string;
};

export type InvoiceDto = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId: string;
  customer: InvoiceCustomerDto;
  subscription: InvoiceSubscriptionDto;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  amount: number | string;
  currency: 'PKR';
  status: ApiInvoiceStatus;
  dueDate: string;
  timeline: BillingTimelineEventDto[];
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
};

export type PaymentDto = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customer: InvoiceCustomerDto;
  amount: number | string;
  currency: 'PKR';
  method: ApiPaymentMethod;
  status: ApiPaymentStatus;
  reference: string;
  actorId: string;
  failureReason: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type BillingSummaryDto = {
  totalRevenue: number | string;
  collectedPayments: number | string;
  pendingPayments: number | string;
  overdueAmount: number | string;
};

export type InvoiceStatus =
  'generated' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentStatus = 'successful' | 'pending' | 'failed';

export type PaymentMethod =
  'cash' | 'card' | 'bank_transfer' | 'easypaisa' | 'jazzcash';

export type BillingEventType =
  | 'created'
  | 'generated'
  | 'payment_received'
  | 'payment_failed'
  | 'marked_paid'
  | 'overdue'
  | 'cancelled';

export type InvoiceCustomer = InvoiceCustomerDto;

export type InvoiceSubscription = {
  id: string;
  packageId: string;
  packageName: string;
  packageSpeedMbps: number;
  packagePrice: number;
};

export type BillingTimelineEvent = {
  id: string;
  type: BillingEventType;
  note: string | null;
  createdAt: string;
};

export type AdminPayment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customer: InvoiceCustomer;
  amount: number;
  currency: 'PKR';
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  actorId: string;
  failureReason: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type AdminInvoice = {
  id: string;
  invoiceNumber: string;
  customer: InvoiceCustomer;
  subscription: InvoiceSubscription;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  amount: number;
  currency: 'PKR';
  status: InvoiceStatus;
  dueDate: string;
  payments: AdminPayment[];
  timeline: BillingTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
};

export type AdminBillingSummary = {
  totalRevenue: number;
  collectedPayments: number;
  pendingPayments: number;
  overdueAmount: number;
};

export type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  failureReason?: string | null;
  actorId?: string;
};

export type MarkInvoicePaidInput = {
  invoiceId: string;
};

export type InvoiceStatusFilter = InvoiceStatus | 'all';

export type PaymentStatusFilter = PaymentStatus | 'no_payment' | 'all';
