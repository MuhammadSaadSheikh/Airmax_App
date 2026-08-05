export type BillingStatus = 'pending' | 'paid' | 'overdue';
export type PaymentMethodType = 'card' | 'wallet' | 'bank';
export type PaymentStatus = 'completed' | 'pending' | 'failed';

export interface InvoiceItem { id: string; description: string; quantity: number; amount: number }
export interface Invoice { id: string; amount: number; date: string; dueDate: string; status: BillingStatus; items: InvoiceItem[] }
export interface Payment { id: string; amount: number; method: string; date: string; status: PaymentStatus; invoiceId: string; reference: string }
export interface PaymentMethod { id: string; type: PaymentMethodType; name: string; detail: string; isDefault: boolean }
export interface BillingSummary { currentAmount: number; dueDate: string; status: BillingStatus; nextBillingDate: string; daysRemaining: number; billingCycle: string; packageName: string; renewalStatus: 'automatic' | 'manual' }
export interface CurrentBillSnapshot { invoice: Invoice; summary: BillingSummary }
export interface PaymentReceipt { transactionId: string; invoiceId: string; amount: number; method: string; paidAt: string; reference: string }
