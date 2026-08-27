import { invoiceApiService } from '@/services/api/invoice/invoice.service';
import { paymentApiService } from '@/services/api/payment/payment.service';
import { createBillingCenterService } from './billingServiceFactory';

export const liveBillingCenterService = createBillingCenterService(
  invoiceApiService,
  paymentApiService,
);
