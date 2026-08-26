import { mockDelay } from '../client';
import { mockCustomerRepository } from '../customers.mock.repository';
import { mockPackageRepository } from '../packages.mock.repository';
import { mockSubscriptionRepository } from '../subscriptions.mock.repository';
import type {
  SubscriptionDto as LegacySubscriptionDto,
  SubscriptionHistoryDto as LegacySubscriptionHistoryDto,
} from '../subscriptions.models';
import { mapSubscriptionDto } from './subscription.mapper';
import type {
  ChangeSubscriptionPackageInput,
  CreateSubscriptionInput,
  CustomerSubscriptionService,
  SubscriptionDto,
  SubscriptionHistoryDto,
  SubscriptionHistoryTypeDto,
} from './subscription.models';

function packageDto(
  packageItem: LegacySubscriptionDto['package'],
  createdAt: string,
  updatedAt: string,
): SubscriptionDto['package'] {
  return {
    id: packageItem.id,
    name: packageItem.name,
    description: packageItem.description,
    speedMbps: packageItem.speedMbps,
    price: packageItem.price,
    billingPeriod: 'MONTHLY',
    features: [...packageItem.features],
    status: packageItem.status,
    createdAt,
    updatedAt,
  };
}

function historyType(
  history: LegacySubscriptionHistoryDto,
): SubscriptionHistoryTypeDto {
  const note = history.note?.toLowerCase() ?? '';
  if (history.status === 'CANCELLED') return 'CANCELLED';
  if (note.includes('package changed')) return 'PACKAGE_CHANGED';
  if (note.includes('assigned')) return 'CREATED';
  return 'STATUS_CHANGED';
}

function historyDto(
  history: LegacySubscriptionHistoryDto,
  index: number,
): SubscriptionHistoryDto {
  return {
    id: history.id,
    type: index === 0 ? 'CREATED' : historyType(history),
    actorId: null,
    previousStatus: null,
    currentStatus: history.status,
    previousPackageId: null,
    currentPackageId: history.packageId,
    packageName: history.packageName,
    packageSpeedMbps: null,
    packagePrice: null,
    metadata: history.note ? { note: history.note } : null,
    occurredAt: history.createdAt,
  };
}

function productionDto(subscription: LegacySubscriptionDto): SubscriptionDto {
  return {
    id: subscription.id,
    customerId: subscription.customer.id,
    packageId: subscription.packageId,
    status: subscription.status,
    startsAt: subscription.startsAt,
    endsAt: subscription.expiresAt,
    cancelledAt:
      subscription.status === 'CANCELLED' ? subscription.updatedAt : null,
    package: packageDto(
      subscription.package,
      subscription.createdAt,
      subscription.updatedAt,
    ),
    history: subscription.history.map(historyDto),
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

function packageForAssignment(packageId: string) {
  const packageItem = mockPackageRepository.getById(packageId);
  if (!packageItem) throw new Error('Package not found');
  return packageItem;
}

function customerForAssignment(customerId: string) {
  const customer = mockCustomerRepository.getById(customerId);
  if (!customer) throw new Error('Customer not found');
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    connectionId: customer.connectionId,
  };
}

function requireSubscription(id: string): LegacySubscriptionDto {
  const subscription = mockSubscriptionRepository.getById(id);
  if (!subscription) throw new Error('Subscription not found');
  return subscription;
}

export const mockCustomerSubscriptionService: CustomerSubscriptionService = {
  async createSubscription(input: CreateSubscriptionInput) {
    await mockDelay();
    const subscription = mockSubscriptionRepository.assignCustomerPackage(
      { customerId: input.customerId, packageId: input.packageId },
      customerForAssignment(input.customerId),
      packageForAssignment(input.packageId),
    );
    return mapSubscriptionDto(productionDto(subscription));
  },

  async getSubscriptionById(id: string) {
    await mockDelay();
    return mapSubscriptionDto(productionDto(requireSubscription(id)));
  },

  async getCustomerSubscriptions(customerId: string) {
    await mockDelay();
    return mockSubscriptionRepository
      .getByCustomerId(customerId)
      .map(productionDto)
      .map(mapSubscriptionDto);
  },

  async changePackage(id: string, input: ChangeSubscriptionPackageInput) {
    await mockDelay();
    const subscription = mockSubscriptionRepository.changePackage(
      { subscriptionId: id, packageId: input.packageId },
      packageForAssignment(input.packageId),
    );
    return mapSubscriptionDto(productionDto(subscription));
  },

  async cancelSubscription(id: string) {
    await mockDelay();
    return mapSubscriptionDto(
      productionDto(mockSubscriptionRepository.cancel(id)),
    );
  },

  async activateSubscription(id: string) {
    await mockDelay();
    return mapSubscriptionDto(
      productionDto(mockSubscriptionRepository.activate(id)),
    );
  },
};
