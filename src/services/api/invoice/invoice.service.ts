import { environment } from '@/config/environment';
import type { InvoiceApiService } from './invoice.models';

function loadInvoiceApiService(): InvoiceApiService {
  if (environment.useMockApi) {
    // Mock financial repositories are initialized only in explicit mock mode.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./invoice.mock.service')
      .mockInvoiceApiService as InvoiceApiService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./invoice.live.service')
    .liveInvoiceApiService as InvoiceApiService;
}

export const invoiceApiService = loadInvoiceApiService();
