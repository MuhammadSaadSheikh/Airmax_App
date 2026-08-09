import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import {
  mapCustomerDetail,
  mapCustomerListItem,
  mapCustomerPackage,
} from './customers.mapper';
import { mockCustomerRepository } from './customers.mock.repository';
import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  ChangeCustomerPackageInput,
  CustomerDetailDto,
  CustomerListFilters,
  CustomerListItemDto,
  CustomerPackageOption,
  SuspendCustomerInput,
  UpdateCustomerInformationInput,
} from './customers.models';

function normalizedSearch(search?: string): string {
  return search?.trim() ?? '';
}

function assertMockActionsEnabled() {
  if (!environment.useMockApi) {
    throw new Error('Customer actions are unavailable outside mock mode');
  }
}

export const customersService = {
  async list(
    filters: CustomerListFilters = {},
  ): Promise<AdminCustomerListItem[]> {
    const search = normalizedSearch(filters.search);

    if (environment.useMockApi) {
      await mockDelay();
      const searchTerm = search.toLowerCase();
      return mockCustomerRepository
        .list()
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
      const customer = mockCustomerRepository.getById(id);
      if (!customer) throw new Error('Customer not found');
      return mapCustomerDetail(customer);
    }

    const response = await apiRequest<CustomerDetailDto>(
      `/users/${encodeURIComponent(id)}`,
    );
    if (response.role !== 'CUSTOMER') throw new Error('Customer not found');
    return mapCustomerDetail(response);
  },

  async listPackageOptions(): Promise<CustomerPackageOption[]> {
    assertMockActionsEnabled();
    await mockDelay();
    return mockCustomerRepository.packages().map(mapCustomerPackage);
  },

  async activateCustomer(customerId: string): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    return mapCustomerDetail(mockCustomerRepository.activate(customerId));
  },

  async suspendCustomer(
    input: SuspendCustomerInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    return mapCustomerDetail(mockCustomerRepository.suspend(input));
  },

  async changePackage(
    input: ChangeCustomerPackageInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    return mapCustomerDetail(mockCustomerRepository.changePackage(input));
  },

  async updateCustomerInformation(
    input: UpdateCustomerInformationInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    return mapCustomerDetail(mockCustomerRepository.updateInformation(input));
  },
};
