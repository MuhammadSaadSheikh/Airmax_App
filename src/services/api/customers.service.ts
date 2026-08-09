import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import { mapCustomerDetail, mapCustomerListItem } from './customers.mapper';
import { mockCustomers } from './customers.mock';
import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  CustomerDetailDto,
  CustomerListFilters,
  CustomerListItemDto,
} from './customers.models';

function normalizedSearch(search?: string): string {
  return search?.trim() ?? '';
}

export const customersService = {
  async list(
    filters: CustomerListFilters = {},
  ): Promise<AdminCustomerListItem[]> {
    const search = normalizedSearch(filters.search);

    if (environment.useMockApi) {
      await mockDelay();
      const searchTerm = search.toLowerCase();
      return mockCustomers
        .filter(customer => customer.role === 'CUSTOMER')
        .filter(customer =>
          `${customer.name} ${customer.phone} ${customer.connectionId ?? ''}`
            .toLowerCase()
            .includes(searchTerm),
        )
        .map(mapCustomerListItem);
    }

    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await apiRequest<CustomerListItemDto[]>(`/users${query}`);
    return response
      .filter(customer => customer.role === 'CUSTOMER')
      .map(mapCustomerListItem);
  },

  async getById(id: string): Promise<AdminCustomerDetail> {
    if (environment.useMockApi) {
      await mockDelay();
      const customer = mockCustomers.find(item => item.id === id);
      if (!customer) throw new Error('Customer not found');
      return mapCustomerDetail(customer);
    }

    const response = await apiRequest<CustomerDetailDto>(
      `/users/${encodeURIComponent(id)}`,
    );
    if (response.role !== 'CUSTOMER') throw new Error('Customer not found');
    return mapCustomerDetail(response);
  },
};
