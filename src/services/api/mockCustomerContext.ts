import { mockCustomerRepository } from './customers.mock.repository';
import type { CustomerDetailDto } from './customers.models';

export function resolveMockCustomer(connectionId: string): CustomerDetailDto {
  const customer = mockCustomerRepository.getByConnectionId(connectionId);
  if (customer) return customer;

  // Mock authentication intentionally has no provisioned connection profile.
  if (connectionId === 'unknown') {
    const previewCustomer = mockCustomerRepository.getById('u1');
    if (previewCustomer) return previewCustomer;
  }
  throw new Error('Customer connection not found');
}
