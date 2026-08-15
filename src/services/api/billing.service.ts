import { environment } from '@/config/environment';
import { mockDelay } from './client';
import { mapBillingSummary, mapInvoice, mapPayment } from './billing.mapper';
import { mockBillingRepository } from './billing.mock.repository';
import type {
  AdminBillingSummary,
  AdminInvoice,
  AdminPayment,
  MarkInvoicePaidInput,
  RecordPaymentInput,
} from './billing.models';

function assertMockMode() {
  if (!environment.useMockApi) {
    throw new Error(
      'Admin billing management is unavailable outside mock mode',
    );
  }
}

function mapRepositoryInvoice(id: string): AdminInvoice {
  const invoice = mockBillingRepository.getInvoiceById(id);
  if (!invoice) throw new Error('Invoice not found');
  return mapInvoice(
    invoice,
    mockBillingRepository.getInvoicePayments(invoice.id),
  );
}

export const adminBillingService = {
  async getInvoices(): Promise<AdminInvoice[]> {
    assertMockMode();
    await mockDelay();
    return mockBillingRepository
      .listInvoices()
      .map(invoice =>
        mapInvoice(
          invoice,
          mockBillingRepository.getInvoicePayments(invoice.id),
        ),
      );
  },

  async getInvoiceById(id: string): Promise<AdminInvoice> {
    assertMockMode();
    await mockDelay();
    return mapRepositoryInvoice(id);
  },

  async getCustomerInvoices(customerId: string): Promise<AdminInvoice[]> {
    assertMockMode();
    await mockDelay();
    return mockBillingRepository
      .getCustomerInvoices(customerId)
      .map(invoice =>
        mapInvoice(
          invoice,
          mockBillingRepository.getInvoicePayments(invoice.id),
        ),
      );
  },

  async getPayments(): Promise<AdminPayment[]> {
    assertMockMode();
    await mockDelay();
    return mockBillingRepository.listPayments().map(mapPayment);
  },

  async getPaymentById(id: string): Promise<AdminPayment> {
    assertMockMode();
    await mockDelay();
    const payment = mockBillingRepository.getPaymentById(id);
    if (!payment) throw new Error('Payment not found');
    return mapPayment(payment);
  },

  async recordPayment(input: RecordPaymentInput): Promise<AdminPayment> {
    assertMockMode();
    await mockDelay(500);
    return mapPayment(mockBillingRepository.recordPayment(input));
  },

  async markInvoicePaid(
    input: string | MarkInvoicePaidInput,
  ): Promise<AdminInvoice> {
    assertMockMode();
    await mockDelay(500);
    const invoiceId = typeof input === 'string' ? input : input.invoiceId;
    mockBillingRepository.markInvoicePaid({ invoiceId });
    return mapRepositoryInvoice(invoiceId);
  },

  async cancelInvoice(id: string): Promise<AdminInvoice> {
    assertMockMode();
    await mockDelay(500);
    mockBillingRepository.cancelInvoice(id);
    return mapRepositoryInvoice(id);
  },

  async getBillingSummary(): Promise<AdminBillingSummary> {
    assertMockMode();
    await mockDelay();
    return mapBillingSummary(mockBillingRepository.getSummary());
  },
};
