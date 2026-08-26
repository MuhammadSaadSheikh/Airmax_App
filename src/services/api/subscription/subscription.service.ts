import { environment } from '@/config/environment';
import type { CustomerSubscriptionService } from './subscription.models';

function loadCustomerSubscriptionService(): CustomerSubscriptionService {
  if (environment.useMockApi) {
    // Existing mock repositories are initialized only for explicit mock builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./subscription.mock.service')
      .mockCustomerSubscriptionService as CustomerSubscriptionService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./subscription.live.service')
    .liveCustomerSubscriptionService as CustomerSubscriptionService;
}

export const customerSubscriptionService = loadCustomerSubscriptionService();
