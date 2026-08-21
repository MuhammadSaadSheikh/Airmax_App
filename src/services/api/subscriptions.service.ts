import { environment } from '@/config/environment';
import { mockDelay } from './client';
import { mapSubscription } from './subscriptions.mapper';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
import { mockCustomerRepository } from './customers.mock.repository';
import { mockPackageRepository } from './packages.mock.repository';
import { mockBillingRepository } from './billing.mock.repository';
import type {
  AdminSubscription,
  AssignCustomerSubscriptionInput,
  ChangeSubscriptionPackageInput,
  SubscriptionActionInput,
} from './subscriptions.models';

function assertMockMode() {
  if (!environment.useMockApi) {
    throw new Error(
      'Admin subscription management is unavailable outside mock mode',
    );
  }
}

function packageForAssignment(packageId: string) {
  const packageItem = mockPackageRepository.getById(packageId);
  if (!packageItem) throw new Error('Package not found');
  return packageItem;
}

function customerSnapshot(customerId: string) {
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

export const subscriptionsService = {
  async listSubscriptions(): Promise<AdminSubscription[]> {
    assertMockMode();
    await mockDelay();
    return mockSubscriptionRepository.list().map(mapSubscription);
  },

  async getSubscriptionById(id: string): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay();
    const subscription = mockSubscriptionRepository.getById(id);
    if (!subscription) throw new Error('Subscription not found');
    return mapSubscription(subscription);
  },

  async getCustomerSubscriptions(
    customerId: string,
  ): Promise<AdminSubscription[]> {
    assertMockMode();
    await mockDelay();
    return mockSubscriptionRepository
      .getByCustomerId(customerId)
      .map(mapSubscription);
  },

  async activateSubscription(
    id: string | SubscriptionActionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    const subscription = mockSubscriptionRepository.activate(
      typeof id === 'string' ? id : id.subscriptionId,
    );
    mockCustomerRepository.setStatus(subscription.userId, 'ACTIVE');
    return mapSubscription(subscription);
  },

  async suspendSubscription(
    id: string | SubscriptionActionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    const subscription = mockSubscriptionRepository.suspend(
      typeof id === 'string' ? id : id.subscriptionId,
    );
    mockCustomerRepository.setStatus(subscription.userId, 'SUSPENDED');
    return mapSubscription(subscription);
  },

  async cancelSubscription(
    id: string | SubscriptionActionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    const subscription = mockSubscriptionRepository.cancel(
      typeof id === 'string' ? id : id.subscriptionId,
    );
    mockCustomerRepository.setStatus(subscription.userId, 'DISABLED');
    return mapSubscription(subscription);
  },

  async changeSubscriptionPackage(
    input: ChangeSubscriptionPackageInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    return mapSubscription(
      mockSubscriptionRepository.changePackage(
        input,
        packageForAssignment(input.packageId),
      ),
    );
  },

  async assignCustomerPackage(
    input: AssignCustomerSubscriptionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    const subscription = mockSubscriptionRepository.assignCustomerPackage(
      input,
      customerSnapshot(input.customerId),
      packageForAssignment(input.packageId),
    );
    mockBillingRepository.ensureInvoiceForSubscription(subscription);
    return mapSubscription(subscription);
  },
};
