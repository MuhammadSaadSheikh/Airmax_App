import type { CurrentBillSnapshot, Invoice, Payment, PaymentMethod, PaymentReceipt } from './models';

export interface BillingService {
  getCurrentBill(connectionId: string): Promise<CurrentBillSnapshot>;
  getInvoices(connectionId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getPaymentHistory(connectionId: string): Promise<Payment[]>;
  getPaymentMethods(connectionId: string): Promise<PaymentMethod[]>;
  processPayment(invoiceId: string, methodId: string): Promise<PaymentReceipt>;
}

const invoices: Invoice[] = [
  { id: 'AMX-2608-1042', amount: 3500, date: '1 August 2026', dueDate: '15 August 2026', status: 'pending', items: [{ id: 'service', description: 'AIRMAX Premium — Monthly service', quantity: 1, amount: 3500 }] },
  { id: 'AMX-2607-1042', amount: 3500, date: '1 July 2026', dueDate: '15 July 2026', status: 'paid', items: [{ id: 'service', description: 'AIRMAX Premium — Monthly service', quantity: 1, amount: 3500 }] },
  { id: 'AMX-2606-1042', amount: 3500, date: '1 June 2026', dueDate: '15 June 2026', status: 'paid', items: [{ id: 'service', description: 'AIRMAX Premium — Monthly service', quantity: 1, amount: 3500 }] },
];
const payments: Payment[] = [
  { id: 'TXN-0726-1042', amount: 3500, method: 'Visa •••• 4242', date: '5 July 2026', status: 'completed', invoiceId: 'AMX-2607-1042', reference: 'RCP-2607051042' },
  { id: 'TXN-0626-1042', amount: 3500, method: 'JazzCash •••• 8831', date: '4 June 2026', status: 'completed', invoiceId: 'AMX-2606-1042', reference: 'RCP-2606041042' },
];
const methods: PaymentMethod[] = [
  { id: 'card-4242', type: 'card', name: 'Visa', detail: '•••• 4242', isDefault: true },
  { id: 'wallet-8831', type: 'wallet', name: 'JazzCash', detail: '•••• 8831', isDefault: false },
  { id: 'bank', type: 'bank', name: 'Bank transfer', detail: 'Secure account transfer', isDefault: false },
];
const paidInvoiceIds = new Set<string>();
const wait = () => new Promise<void>(resolve => setTimeout(resolve, 320));
const copyInvoice = (invoice: Invoice): Invoice => ({ ...invoice, items: invoice.items.map(item => ({ ...item })) });

export const billingCenterService: BillingService = {
  async getCurrentBill(connectionId) { void connectionId; await wait(); const paid = paidInvoiceIds.has(invoices[0]!.id); return { invoice: { ...copyInvoice(invoices[0]!), status: paid ? 'paid' : 'pending' }, summary: { currentAmount: paid ? 0 : 3500, dueDate: '15 August 2026', status: paid ? 'paid' : 'pending', nextBillingDate: '1 September 2026', daysRemaining: paid ? 0 : 10, billingCycle: 'Monthly', packageName: 'AIRMAX Premium', renewalStatus: 'automatic' } }; },
  async getInvoices(connectionId) { void connectionId; await wait(); return invoices.map(invoice => ({ ...copyInvoice(invoice), status: paidInvoiceIds.has(invoice.id) ? 'paid' : invoice.status })); },
  async getInvoice(id) { await wait(); const invoice = invoices.find(item => item.id === id); return invoice ? { ...copyInvoice(invoice), status: paidInvoiceIds.has(id) ? 'paid' : invoice.status } : undefined; },
  async getPaymentHistory(connectionId) { void connectionId; await wait(); return payments.map(payment => ({ ...payment })); },
  async getPaymentMethods(connectionId) { void connectionId; await wait(); return methods.map(method => ({ ...method })); },
  async processPayment(invoiceId, methodId) { await new Promise<void>(resolve => setTimeout(resolve, 900)); const method = methods.find(item => item.id === methodId) ?? methods[0]!; paidInvoiceIds.add(invoiceId); return { transactionId: `TXN-${Date.now()}`, invoiceId, amount: invoices.find(item => item.id === invoiceId)?.amount ?? 3500, method: `${method.name} ${method.detail}`, paidAt: new Date().toISOString(), reference: `RCP-${Date.now()}` }; },
};
