import { apiRequest } from '../client';
import { mapInvoiceDto } from './invoice.mapper';
import type { InvoiceApiService, InvoiceDto } from './invoice.models';

export const liveInvoiceApiService: InvoiceApiService = {
  async getInvoiceById(id: string) {
    return mapInvoiceDto(
      await apiRequest<InvoiceDto>(`/invoices/${encodeURIComponent(id)}`),
    );
  },

  async getCustomerInvoices(customerId: string) {
    const invoices = await apiRequest<InvoiceDto[]>(
      `/customers/${encodeURIComponent(customerId)}/invoices`,
    );
    return invoices.map(mapInvoiceDto);
  },
};
