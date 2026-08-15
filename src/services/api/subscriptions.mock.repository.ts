import { mockCustomers } from './customers.mock';
import { mockPackageRepository } from './packages.mock.repository';
import type { PackageDto } from './packages.models';
import { mockSubscriptions } from './subscriptions.mock';
import type {
  ApiSubscriptionStatus,
  AssignCustomerSubscriptionInput,
  ChangeSubscriptionPackageInput,
  SubscriptionCustomerDto,
  SubscriptionDto,
} from './subscriptions.models';

let subscriptionsState = cloneSubscriptions(mockSubscriptions);

function cloneSubscription(subscription: SubscriptionDto): SubscriptionDto {
  return {
    ...subscription,
    customer: { ...subscription.customer },
    package: {
      ...subscription.package,
      features: [...subscription.package.features],
    },
    history: subscription.history.map(event => ({ ...event })),
  };
}

function cloneSubscriptions(items: SubscriptionDto[]): SubscriptionDto[] {
  return items.map(cloneSubscription);
}

function subscriptionIndex(id: string): number {
  const index = subscriptionsState.findIndex(item => item.id === id);
  if (index < 0) throw new Error('Subscription not found');
  return index;
}

function activePackage(packageId: string): PackageDto {
  const packageItem = mockPackageRepository.getById(packageId);
  if (!packageItem) throw new Error('Package not found');
  if (packageItem.status !== 'ACTIVE') {
    throw new Error('Inactive packages cannot be assigned');
  }
  return packageItem;
}

function packageSnapshot(packageItem: PackageDto): SubscriptionDto['package'] {
  return { ...packageItem, features: [...packageItem.features] };
}

function appendHistory(
  subscription: SubscriptionDto,
  status: ApiSubscriptionStatus,
  note: string,
  createdAt: string,
): SubscriptionDto['history'] {
  return [
    ...subscription.history,
    {
      id: `history-${subscription.id}-${subscription.history.length + 1}`,
      subscriptionId: subscription.id,
      status,
      packageId: subscription.packageId,
      packageName: subscription.package.name,
      note,
      createdAt,
    },
  ];
}

function updateStatus(
  subscriptionId: string,
  status: ApiSubscriptionStatus,
  allowed: ApiSubscriptionStatus[],
  note: string,
): SubscriptionDto {
  const index = subscriptionIndex(subscriptionId);
  const current = subscriptionsState[index]!;
  if (!allowed.includes(current.status)) {
    throw new Error(
      `A ${current.status.toLowerCase()} subscription cannot be updated to ${status.toLowerCase()}`,
    );
  }
  const updatedAt = new Date().toISOString();
  const updated: SubscriptionDto = {
    ...current,
    status,
    updatedAt,
    history: appendHistory(current, status, note, updatedAt),
  };
  subscriptionsState[index] = updated;
  return cloneSubscription(updated);
}

export const mockSubscriptionRepository = {
  list(): SubscriptionDto[] {
    return cloneSubscriptions(subscriptionsState);
  },

  getById(id: string): SubscriptionDto | undefined {
    const item = subscriptionsState.find(
      subscription => subscription.id === id,
    );
    return item ? cloneSubscription(item) : undefined;
  },

  getByCustomerId(customerId: string): SubscriptionDto[] {
    return cloneSubscriptions(
      subscriptionsState.filter(item => item.userId === customerId),
    );
  },

  activate(subscriptionId: string): SubscriptionDto {
    return updateStatus(
      subscriptionId,
      'ACTIVE',
      ['PENDING', 'SUSPENDED'],
      'Subscription activated',
    );
  },

  suspend(subscriptionId: string): SubscriptionDto {
    return updateStatus(
      subscriptionId,
      'SUSPENDED',
      ['ACTIVE'],
      'Subscription suspended',
    );
  },

  cancel(subscriptionId: string): SubscriptionDto {
    return updateStatus(
      subscriptionId,
      'CANCELLED',
      ['SUSPENDED'],
      'Subscription cancelled',
    );
  },

  changePackage(input: ChangeSubscriptionPackageInput): SubscriptionDto {
    const index = subscriptionIndex(input.subscriptionId);
    const current = subscriptionsState[index]!;
    if (current.status === 'CANCELLED' || current.status === 'EXPIRED') {
      throw new Error('This subscription package cannot be changed');
    }
    const selectedPackage = activePackage(input.packageId);
    if (current.packageId === input.packageId) {
      throw new Error('Select a different package');
    }
    const updatedAt = new Date().toISOString();
    const next: SubscriptionDto = {
      ...current,
      packageId: selectedPackage.id,
      package: packageSnapshot(selectedPackage),
      updatedAt,
    };
    const updated: SubscriptionDto = {
      ...next,
      history: appendHistory(
        next,
        next.status,
        `Package changed to ${selectedPackage.name}`,
        updatedAt,
      ),
    };
    subscriptionsState[index] = updated;
    return cloneSubscription(updated);
  },

  assignCustomerPackage(
    input: AssignCustomerSubscriptionInput,
  ): SubscriptionDto {
    const existing = subscriptionsState.find(
      item => item.userId === input.customerId,
    );
    if (existing) {
      return this.changePackage({
        subscriptionId: existing.id,
        packageId: input.packageId,
      });
    }
    const customer = mockCustomers.find(item => item.id === input.customerId);
    if (!customer) throw new Error('Customer not found');
    const selectedPackage = activePackage(input.packageId);
    const timestamp = new Date().toISOString();
    const customerSnapshot: SubscriptionCustomerDto = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      connectionId: customer.connectionId,
    };
    const subscription: SubscriptionDto = {
      id: `mock-sub-${customer.id}`,
      userId: customer.id,
      packageId: selectedPackage.id,
      status: 'PENDING',
      startsAt: timestamp,
      expiresAt: new Date(
        Date.now() + selectedPackage.durationDays * 86_400_000,
      ).toISOString(),
      pppoeUsername: customer.connectionId?.toLowerCase() ?? null,
      customer: customerSnapshot,
      package: packageSnapshot(selectedPackage),
      history: [
        {
          id: `history-mock-sub-${customer.id}-1`,
          subscriptionId: `mock-sub-${customer.id}`,
          status: 'PENDING',
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          note: 'Package assigned; activation pending',
          createdAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    subscriptionsState = [...subscriptionsState, subscription];
    return cloneSubscription(subscription);
  },

  updateCustomer(customer: SubscriptionCustomerDto): void {
    subscriptionsState = subscriptionsState.map(subscription =>
      subscription.userId === customer.id
        ? { ...subscription, customer: { ...customer } }
        : subscription,
    );
  },

  reset(): void {
    subscriptionsState = cloneSubscriptions(mockSubscriptions);
  },
};
