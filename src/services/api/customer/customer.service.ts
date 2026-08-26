import { environment } from '@/config/environment';
import type { CustomerService } from './customer.models';

function loadCustomerService(): CustomerService {
  if (environment.useMockApi) {
    // Lazy loading prevents production from initializing local customer data.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./customer.mock.service')
      .mockCustomerService as CustomerService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./customer.live.service')
    .liveCustomerService as CustomerService;
}

export const customerService = loadCustomerService();
