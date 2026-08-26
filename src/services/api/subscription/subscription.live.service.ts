import { apiRequest } from '../client';
import { mapSubscriptionDto } from './subscription.mapper';
import type {
  ChangeSubscriptionPackageInput,
  CreateSubscriptionInput,
  CustomerSubscriptionService,
  SubscriptionDto,
} from './subscription.models';

export const liveCustomerSubscriptionService: CustomerSubscriptionService = {
  async createSubscription(input: CreateSubscriptionInput) {
    const subscription = await apiRequest<SubscriptionDto>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapSubscriptionDto(subscription);
  },

  async getSubscriptionById(id: string) {
    return mapSubscriptionDto(
      await apiRequest<SubscriptionDto>(
        `/subscriptions/${encodeURIComponent(id)}`,
      ),
    );
  },

  async getCustomerSubscriptions(customerId: string) {
    const subscriptions = await apiRequest<SubscriptionDto[]>(
      `/customers/${encodeURIComponent(customerId)}/subscriptions`,
    );
    return subscriptions.map(mapSubscriptionDto);
  },

  async changePackage(id: string, input: ChangeSubscriptionPackageInput) {
    const subscription = await apiRequest<SubscriptionDto>(
      `/subscriptions/${encodeURIComponent(id)}/package`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return mapSubscriptionDto(subscription);
  },

  async cancelSubscription(id: string, reason?: string) {
    const subscription = await apiRequest<SubscriptionDto>(
      `/subscriptions/${encodeURIComponent(id)}/cancel`,
      { method: 'PATCH', body: JSON.stringify({ reason }) },
    );
    return mapSubscriptionDto(subscription);
  },

  async activateSubscription(id: string) {
    const subscription = await apiRequest<SubscriptionDto>(
      `/subscriptions/${encodeURIComponent(id)}/activate`,
      { method: 'PATCH' },
    );
    return mapSubscriptionDto(subscription);
  },
};
