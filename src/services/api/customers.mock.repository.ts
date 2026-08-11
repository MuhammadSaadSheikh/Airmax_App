import { mockCustomers } from './customers.mock';
import { mockPackageRepository } from './packages.mock.repository';
import type {
  ApiCustomerStatus,
  ApiSubscriptionStatus,
  ChangeCustomerPackageInput,
  CustomerDetailDto,
  CustomerPackageDto,
  SuspendCustomerInput,
  UpdateCustomerInformationInput,
} from './customers.models';

let customersState = cloneCustomers(mockCustomers);
const suspensionReasons = new Map<string, SuspendCustomerInput['reason']>();

function clonePackage(customerPackage: CustomerPackageDto): CustomerPackageDto {
  return { ...customerPackage, features: [...customerPackage.features] };
}

function cloneCustomer(customer: CustomerDetailDto): CustomerDetailDto {
  return {
    ...customer,
    routerDetails:
      typeof customer.routerDetails === 'object' &&
      customer.routerDetails !== null &&
      !Array.isArray(customer.routerDetails)
        ? { ...customer.routerDetails }
        : customer.routerDetails,
    subscriptions: customer.subscriptions.map(subscription => ({
      ...subscription,
      package: clonePackage(subscription.package),
    })),
  };
}

function cloneCustomers(customers: CustomerDetailDto[]): CustomerDetailDto[] {
  return customers.map(cloneCustomer);
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
  if (customerStatus === 'ACTIVE' && customer.subscriptions.length === 0) {
    throw new Error('Select a package before activating this customer');
  }

  const updatedAt = new Date().toISOString();
  const updated: CustomerDetailDto = {
    ...customer,
    status: customerStatus,
    updatedAt,
    subscriptions: customer.subscriptions.map((subscription, position) =>
      position === 0
        ? { ...subscription, status: subscriptionStatus, updatedAt }
        : subscription,
    ),
  };
  customersState[index] = updated;
  return cloneCustomer(updated);
}

export const mockCustomerRepository = {
  list(): CustomerDetailDto[] {
    return cloneCustomers(customersState);
  },

  getById(id: string): CustomerDetailDto | undefined {
    const customer = customersState.find(item => item.id === id);
    return customer ? cloneCustomer(customer) : undefined;
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
    return cloneCustomer(updated);
  },

  changePackage(input: ChangeCustomerPackageInput): CustomerDetailDto {
    const index = customerIndex(input.customerId);
    const customer = customersState[index]!;
    const selectedPackage = mockPackageRepository
      .list()
      .find(item => item.id === input.packageId);
    if (!selectedPackage) throw new Error('Package not found');
    if (selectedPackage.status !== 'ACTIVE') {
      throw new Error('Inactive packages cannot be assigned');
    }

    const updatedAt = new Date().toISOString();
    const currentSubscription = customer.subscriptions[0];
    const subscriptions = currentSubscription
      ? [
          {
            ...currentSubscription,
            packageId: selectedPackage.id,
            package: clonePackage(selectedPackage),
            updatedAt,
          },
          ...customer.subscriptions.slice(1),
        ]
      : [
          {
            id: `mock-sub-${customer.id}`,
            userId: customer.id,
            packageId: selectedPackage.id,
            status: 'PENDING' as const,
            startsAt: updatedAt,
            expiresAt: new Date(
              Date.now() + selectedPackage.durationDays * 86_400_000,
            ).toISOString(),
            pppoeUsername: customer.connectionId?.toLowerCase() ?? null,
            createdAt: updatedAt,
            updatedAt,
            package: clonePackage(selectedPackage),
          },
        ];

    const updated: CustomerDetailDto = {
      ...customer,
      subscriptions,
      updatedAt,
    };
    customersState[index] = updated;
    return cloneCustomer(updated);
  },

  reset(): void {
    customersState = cloneCustomers(mockCustomers);
    suspensionReasons.clear();
  },
};
