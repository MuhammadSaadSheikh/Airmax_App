import { environment } from '@/config/environment';
import type { PaymentApiService } from './payment.models';

function loadPaymentApiService(): PaymentApiService {
  if (environment.useMockApi) {
    // Mock financial repositories are initialized only in explicit mock mode.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./payment.mock.service')
      .mockPaymentApiService as PaymentApiService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./payment.live.service')
    .livePaymentApiService as PaymentApiService;
}

export const paymentApiService = loadPaymentApiService();
