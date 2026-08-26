import { apiRequest } from '../client';
import {
  mapCustomerDto,
  mapCustomerStatusInput,
  mapCustomerUpdateInput,
} from './customer.mapper';
import type {
  CustomerDto,
  CustomerService,
  CustomerStatus,
  UpdateCustomerProfileInput,
} from './customer.models';

export const liveCustomerService: CustomerService = {
  async getCurrentCustomer() {
    return mapCustomerDto(await apiRequest<CustomerDto>('/customers/me'));
  },

  async getCustomerById(id: string) {
    return mapCustomerDto(
      await apiRequest<CustomerDto>(`/customers/${encodeURIComponent(id)}`),
    );
  },

  async updateCustomer(id: string, input: UpdateCustomerProfileInput) {
    const customer = await apiRequest<CustomerDto>(
      `/customers/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(mapCustomerUpdateInput(input)),
      },
    );
    return mapCustomerDto(customer);
  },

  async updateCustomerStatus(id: string, status: CustomerStatus) {
    const customer = await apiRequest<CustomerDto>(
      `/customers/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: mapCustomerStatusInput(status) }),
      },
    );
    return mapCustomerDto(customer);
  },
};
