const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  AuthorizationError,
  ValidationError,
} from '../src/services/api/errors';
import { liveCustomerSubscriptionService } from '../src/services/api/subscription/subscription.live.service';

const packageDto = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Premium Fiber',
  description: 'High-speed connectivity.',
  speedMbps: 100,
  price: '3500.00',
  billingPeriod: 'MONTHLY',
  features: ['4K streaming'],
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
} as const;

const subscriptionDto = {
  id: '30000000-0000-4000-8000-000000000001',
  customerId: '10000000-0000-4000-8000-000000000001',
  packageId: packageDto.id,
  status: 'ACTIVE',
  startsAt: '2026-08-01T00:00:00.000Z',
  endsAt: '2026-09-01T00:00:00.000Z',
  cancelledAt: null,
  package: packageDto,
  history: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      type: 'CREATED',
      actorId: '50000000-0000-4000-8000-000000000001',
      previousStatus: null,
      currentStatus: 'PENDING',
      previousPackageId: null,
      currentPackageId: packageDto.id,
      packageName: packageDto.name,
      packageSpeedMbps: packageDto.speedMbps,
      packagePrice: packageDto.price,
      metadata: { event: 'CREATED' },
      occurredAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
} as const;

describe('Phase 4.4D production subscription service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue(subscriptionDto);
  });

  it('fetches subscriptions owned by Customer.id without User ownership', async () => {
    mockApiRequest.mockResolvedValue([subscriptionDto]);
    const subscriptions =
      await liveCustomerSubscriptionService.getCustomerSubscriptions(
        subscriptionDto.customerId,
      );
    expect(subscriptions).toEqual([
      expect.objectContaining({
        id: subscriptionDto.id,
        customerId: subscriptionDto.customerId,
        packageId: packageDto.id,
        status: 'active',
      }),
    ]);
    expect(subscriptions[0]).not.toHaveProperty('userId');
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/customers/${subscriptionDto.customerId}/subscriptions`,
    );
  });

  it('fetches subscription detail and mapped package relation', async () => {
    await expect(
      liveCustomerSubscriptionService.getSubscriptionById(subscriptionDto.id),
    ).resolves.toMatchObject({
      id: subscriptionDto.id,
      package: { id: packageDto.id, price: 3500 },
      history: [{ type: 'created', packagePrice: 3500 }],
    });
  });

  it('creates a Customer-owned subscription', async () => {
    const input = {
      customerId: subscriptionDto.customerId,
      packageId: packageDto.id,
    };
    await liveCustomerSubscriptionService.createSubscription(input);
    expect(mockApiRequest).toHaveBeenCalledWith('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  });

  it('changes the backend package relation', async () => {
    const input = { packageId: '20000000-0000-4000-8000-000000000002' };
    await liveCustomerSubscriptionService.changePackage(
      subscriptionDto.id,
      input,
    );
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/subscriptions/${subscriptionDto.id}/package`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
  });

  it('cancels a subscription with an optional reason', async () => {
    await liveCustomerSubscriptionService.cancelSubscription(
      subscriptionDto.id,
      'Customer request',
    );
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/subscriptions/${subscriptionDto.id}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Customer request' }),
      },
    );
  });

  it('integrates the admin-only activation endpoint without exposing it in customer UI', async () => {
    await liveCustomerSubscriptionService.activateSubscription(
      subscriptionDto.id,
    );
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/subscriptions/${subscriptionDto.id}/activate`,
      { method: 'PATCH' },
    );
  });

  it.each([
    [
      'ownership rejection',
      new AuthorizationError('Subscription access denied', 403),
      AuthorizationError,
    ],
    [
      'validation failure',
      new ValidationError('Invalid packageId', 422),
      ValidationError,
    ],
  ])('preserves normalized %s', async (_label, error, ErrorType) => {
    mockApiRequest.mockRejectedValue(error);
    await expect(
      liveCustomerSubscriptionService.getSubscriptionById(subscriptionDto.id),
    ).rejects.toBeInstanceOf(ErrorType);
  });
});
