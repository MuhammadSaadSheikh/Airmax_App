import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import {
  mapCustomerDetail,
  mapCustomerListItem,
  mapCustomerPackage,
} from './customers.mapper';
import { mockCustomerRepository } from './customers.mock.repository';
import { mockPackageRepository } from './packages.mock.repository';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
import { subscriptionsService } from './subscriptions.service';
import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  ChangeCustomerPackageInput,
  CreateCustomerInput,
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

function hydrateCustomer(customer: CustomerDetailDto): CustomerDetailDto {
  return {
    ...customer,
    subscriptions: mockSubscriptionRepository
      .getByCustomerId(customer.id)
      .map(subscription => ({
        id: subscription.id,
        userId: subscription.userId,
        packageId: subscription.packageId,
        status: subscription.status,
        startsAt: subscription.startsAt,
        expiresAt: subscription.expiresAt,
        pppoeUsername: subscription.pppoeUsername,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        package: {
          ...subscription.package,
          features: [...subscription.package.features],
        },
      })),
  };
}

function synchronizeSubscriptionCustomer(customer: CustomerDetailDto) {
  mockSubscriptionRepository.updateCustomer({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    connectionId: customer.connectionId,
  });
}

export const customersService = {
  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    return mapCustomerDetail(
      hydrateCustomer(mockCustomerRepository.create(input)),
    );
  },

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
      return mapCustomerDetail(hydrateCustomer(customer));
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
    return mockPackageRepository
      .list()
      .filter(packageItem => packageItem.status === 'ACTIVE')
      .map(mapCustomerPackage);
  },

  async activateCustomer(customerId: string): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    const subscription =
      mockSubscriptionRepository.getByCustomerId(customerId)[0];
    if (!subscription)
      throw new Error('Select a package before activating this customer');
    if (subscription.status !== 'ACTIVE') {
      mockSubscriptionRepository.activate(subscription.id);
    }
    return mapCustomerDetail(
      hydrateCustomer(mockCustomerRepository.setStatus(customerId, 'ACTIVE')),
    );
  },

  async suspendCustomer(
    input: SuspendCustomerInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    const subscription = mockSubscriptionRepository.getByCustomerId(
      input.customerId,
    )[0];
    if (subscription?.status === 'ACTIVE') {
      mockSubscriptionRepository.suspend(subscription.id);
    }
    return mapCustomerDetail(
      hydrateCustomer(mockCustomerRepository.suspend(input)),
    );
  },

  async changePackage(
    input: ChangeCustomerPackageInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await subscriptionsService.assignCustomerPackage(input);
    const customer = mockCustomerRepository.getById(input.customerId);
    if (!customer) throw new Error('Customer not found');
    return mapCustomerDetail(hydrateCustomer(customer));
  },

  async updateCustomerInformation(
    input: UpdateCustomerInformationInput,
  ): Promise<AdminCustomerDetail> {
    assertMockActionsEnabled();
    await mockDelay(500);
    const customer = mockCustomerRepository.updateInformation(input);
    synchronizeSubscriptionCustomer(customer);
    return mapCustomerDetail(hydrateCustomer(customer));
  },
};
