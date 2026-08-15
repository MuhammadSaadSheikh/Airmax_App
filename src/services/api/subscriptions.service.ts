import { environment } from '@/config/environment';
import { mockDelay } from './client';
import { mapSubscription } from './subscriptions.mapper';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
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
    return mapSubscription(
      mockSubscriptionRepository.activate(
        typeof id === 'string' ? id : id.subscriptionId,
      ),
    );
  },

  async suspendSubscription(
    id: string | SubscriptionActionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    return mapSubscription(
      mockSubscriptionRepository.suspend(
        typeof id === 'string' ? id : id.subscriptionId,
      ),
    );
  },

  async cancelSubscription(
    id: string | SubscriptionActionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    return mapSubscription(
      mockSubscriptionRepository.cancel(
        typeof id === 'string' ? id : id.subscriptionId,
      ),
    );
  },

  async changeSubscriptionPackage(
    input: ChangeSubscriptionPackageInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    return mapSubscription(mockSubscriptionRepository.changePackage(input));
  },

  async assignCustomerPackage(
    input: AssignCustomerSubscriptionInput,
  ): Promise<AdminSubscription> {
    assertMockMode();
    await mockDelay(500);
    return mapSubscription(
      mockSubscriptionRepository.assignCustomerPackage(input),
    );
  },
};
