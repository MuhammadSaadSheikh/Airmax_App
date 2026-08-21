jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { customersService } from '@/services/api/customers.service';
import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { mockSubscriptionRepository } from '@/services/api/subscriptions.mock.repository';
import { subscriptionsService } from '@/services/api/subscriptions.service';
import { mockSystemRepository } from '@/services/api/mockSystem.repository';

describe('Phase 3C extension admin subscription management', () => {
  beforeEach(() => {
    mockSystemRepository.reset();
  });

  it('lists deterministic subscriptions for existing customers', async () => {
    const subscriptions = await subscriptionsService.listSubscriptions();

    expect(
      subscriptions.map(item => [
        item.customer.name,
        item.package.name,
        item.status,
      ]),
    ).toEqual([
      ['Ahmed Khan', 'Premium', 'active'],
      ['Sara Ali', 'Air Plus', 'expired'],
      ['Hamza Noor', 'Ultra Fiber', 'suspended'],
    ]);
  });

  it('gets subscription detail and customer subscriptions', async () => {
    const detail = await subscriptionsService.getSubscriptionById('sub-u1');
    const customerSubscriptions =
      await subscriptionsService.getCustomerSubscriptions('u1');

    expect(detail.customer.id).toBe('u1');
    expect(detail.history).toHaveLength(1);
    expect(customerSubscriptions).toEqual([detail]);
  });

  it('activates a suspended subscription and appends history', async () => {
    const updated = await subscriptionsService.activateSubscription('sub-u3');

    expect(updated.status).toBe('active');
    expect(updated.history.at(-1)).toEqual(
      expect.objectContaining({ status: 'active' }),
    );
  });

  it('suspends an active subscription and appends history', async () => {
    const updated = await subscriptionsService.suspendSubscription('sub-u1');

    expect(updated.status).toBe('suspended');
    expect(updated.history.at(-1)).toEqual(
      expect.objectContaining({ status: 'suspended' }),
    );
  });

  it('cancels a suspended subscription', async () => {
    const updated = await subscriptionsService.cancelSubscription('sub-u3');

    expect(updated.status).toBe('cancelled');
  });

  it('changes package while preserving subscription and customer identity', async () => {
    const before = await subscriptionsService.getSubscriptionById('sub-u1');
    const updated = await subscriptionsService.changeSubscriptionPackage({
      subscriptionId: 'sub-u1',
      packageId: 'plus',
    });

    expect(updated.id).toBe(before.id);
    expect(updated.customer).toEqual(before.customer);
    expect(updated.startsAt).toBe(before.startsAt);
    expect(updated.package.name).toBe('Air Plus');
    expect(updated.history.at(-1)?.note).toBe('Package changed to Air Plus');
  });

  it('keeps Phase 3B package assignment on the subscription source of truth', async () => {
    const customer = await customersService.changePackage({
      customerId: 'u1',
      packageId: 'plus',
    });
    const subscription =
      await subscriptionsService.getSubscriptionById('sub-u1');

    expect(customer.latestSubscription?.package.id).toBe('plus');
    expect(subscription.package.id).toBe('plus');
  });

  it('returns defensive copies for nested relations and history', () => {
    const firstRead = mockSubscriptionRepository.list();
    firstRead[0]!.customer.name = 'Changed outside repository';
    firstRead[0]!.package.features.push('Injected feature');
    firstRead[0]!.history[0]!.note = 'Injected history';

    const secondRead = mockSubscriptionRepository.list();
    expect(secondRead[0]!.customer.name).toBe('Ahmed Khan');
    expect(secondRead[0]!.package.features).not.toContain('Injected feature');
    expect(secondRead[0]!.history[0]!.note).toBe('Subscription activated');
  });

  it('resets mutable lifecycle and package state', () => {
    mockSubscriptionRepository.suspend('sub-u1');
    mockSubscriptionRepository.changePackage(
      {
        subscriptionId: 'sub-u1',
        packageId: 'plus',
      },
      mockPackageRepository.getById('plus')!,
    );
    mockSubscriptionRepository.reset();

    expect(mockSubscriptionRepository.getById('sub-u1')).toEqual(
      expect.objectContaining({ status: 'ACTIVE', packageId: 'premium' }),
    );
  });

  it('rejects invalid subscription operations', async () => {
    await expect(
      subscriptionsService.getSubscriptionById('missing'),
    ).rejects.toThrow('Subscription not found');
    expect(() => mockSubscriptionRepository.suspend('missing')).toThrow(
      'Subscription not found',
    );
    expect(() => mockSubscriptionRepository.cancel('sub-u1')).toThrow(
      'cannot be updated',
    );
  });
});
