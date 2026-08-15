import { mockCustomers } from './customers.mock';
import { mockPackageRepository } from './packages.mock.repository';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
import type {
  ApiCustomerStatus,
  CustomerDetailDto,
  CustomerPackageDto,
  SuspendCustomerInput,
  UpdateCustomerInformationInput,
} from './customers.models';
import type { ApiSubscriptionStatus } from './subscriptions.models';

let customersState = cloneCustomersWithoutSubscriptions(mockCustomers);
const suspensionReasons = new Map<string, SuspendCustomerInput['reason']>();

function clonePackage(customerPackage: CustomerPackageDto): CustomerPackageDto {
  return { ...customerPackage, features: [...customerPackage.features] };
}

function cloneCustomerBase(customer: CustomerDetailDto): CustomerDetailDto {
  return {
    ...customer,
    routerDetails:
      typeof customer.routerDetails === 'object' &&
      customer.routerDetails !== null &&
      !Array.isArray(customer.routerDetails)
        ? { ...customer.routerDetails }
        : customer.routerDetails,
    subscriptions: [],
  };
}

function cloneCustomersWithoutSubscriptions(
  customers: CustomerDetailDto[],
): CustomerDetailDto[] {
  return customers.map(cloneCustomerBase);
}

function hydrateCustomer(customer: CustomerDetailDto): CustomerDetailDto {
  return {
    ...cloneCustomerBase(customer),
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
        package: clonePackage(subscription.package),
      })),
  };
}

function customerIndex(id: string): number {
  const index = customersState.findIndex(customer => customer.id === id);
  if (index < 0) throw new Error('Customer not found');
  return index;
}

function normalizedIdentity(value: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function assertUnique(
  field: 'phone' | 'email' | 'cnic',
  value: string | null,
  customerId: string,
) {
  const normalized = normalizedIdentity(value);
  if (!normalized) return;
  const duplicate = customersState.some(
    customer =>
      customer.id !== customerId &&
      normalizedIdentity(customer[field]) === normalized,
  );
  if (duplicate) {
    const label = field === 'cnic' ? 'CNIC' : field;
    throw new Error(`A customer with this ${label} already exists`);
  }
}

function updateStatus(
  customerId: string,
  customerStatus: ApiCustomerStatus,
  subscriptionStatus: ApiSubscriptionStatus,
): CustomerDetailDto {
  const index = customerIndex(customerId);
  const customer = customersState[index]!;
  const subscription =
    mockSubscriptionRepository.getByCustomerId(customerId)[0];
  if (customerStatus === 'ACTIVE' && !subscription) {
    throw new Error('Select a package before activating this customer');
  }

  if (subscription) {
    if (subscriptionStatus === 'ACTIVE' && subscription.status !== 'ACTIVE') {
      mockSubscriptionRepository.activate(subscription.id);
    } else if (
      subscriptionStatus === 'SUSPENDED' &&
      subscription.status !== 'SUSPENDED'
    ) {
      mockSubscriptionRepository.suspend(subscription.id);
    }
  }

  const updatedAt = new Date().toISOString();
  const updated: CustomerDetailDto = {
    ...customer,
    status: customerStatus,
    updatedAt,
    subscriptions: [],
  };
  customersState[index] = updated;
  return hydrateCustomer(updated);
}

export const mockCustomerRepository = {
  list(): CustomerDetailDto[] {
    return customersState.map(hydrateCustomer);
  },

  getById(id: string): CustomerDetailDto | undefined {
    const customer = customersState.find(item => item.id === id);
    return customer ? hydrateCustomer(customer) : undefined;
  },

  packages(): CustomerPackageDto[] {
    return mockPackageRepository
      .list()
      .filter(packageItem => packageItem.status === 'ACTIVE')
      .map(clonePackage);
  },

  activate(customerId: string): CustomerDetailDto {
    return updateStatus(customerId, 'ACTIVE', 'ACTIVE');
  },

  suspend(input: SuspendCustomerInput): CustomerDetailDto {
    suspensionReasons.set(input.customerId, input.reason);
    return updateStatus(input.customerId, 'SUSPENDED', 'SUSPENDED');
  },

  updateInformation(input: UpdateCustomerInformationInput): CustomerDetailDto {
    const index = customerIndex(input.customerId);
    assertUnique('phone', input.phone, input.customerId);
    assertUnique('email', input.email, input.customerId);
    assertUnique('cnic', input.cnic, input.customerId);

    const customer = customersState[index]!;
    const updated: CustomerDetailDto = {
      ...customer,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      cnic: input.cnic?.trim() || null,
      updatedAt: new Date().toISOString(),
    };
    customersState[index] = updated;
    mockSubscriptionRepository.updateCustomer({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      connectionId: updated.connectionId,
    });
    return hydrateCustomer(updated);
  },

  reset(): void {
    customersState = cloneCustomersWithoutSubscriptions(mockCustomers);
    suspensionReasons.clear();
    mockSubscriptionRepository.reset();
  },
};
