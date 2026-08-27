import { mockCustomerRepository } from '@/services/api/customers.mock.repository';
import { mockInvoiceApiService } from '@/services/api/invoice/invoice.mock.service';
import { resolveMockCustomer } from '@/services/api/mockCustomerContext';
import { mockPaymentApiService } from '@/services/api/payment/payment.mock.service';
import { createBillingCenterService } from './billingServiceFactory';

function resolveMockCustomerId(reference: string): string {
  return (
    mockCustomerRepository.getById(reference)?.id ??
    resolveMockCustomer(reference).id
  );
}

export const mockBillingCenterService = createBillingCenterService(
  mockInvoiceApiService,
  mockPaymentApiService,
  resolveMockCustomerId,
);
