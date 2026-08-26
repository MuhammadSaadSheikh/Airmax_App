jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { mockPackageCatalogService } from '@/services/api/package/package.mock.service';
import { mockCustomerSubscriptionService } from '@/services/api/subscription/subscription.mock.service';
import { mockSystemRepository } from '@/services/api/mockSystem.repository';

describe('Phase 4.4D mock package and subscription compatibility', () => {
  beforeEach(() => mockSystemRepository.reset());

  it('uses the existing active mock package catalogue', async () => {
    const packages = await mockPackageCatalogService.getPackages();
    expect(packages).toHaveLength(4);
    expect(packages.every(packageItem => packageItem.price > 0)).toBe(true);
  });

  it('maps mock subscriptions to Customer ownership without userId', async () => {
    const subscriptions =
      await mockCustomerSubscriptionService.getCustomerSubscriptions('u1');
    expect(subscriptions).toEqual([
      expect.objectContaining({ customerId: 'u1', status: 'active' }),
    ]);
    expect(subscriptions[0]).not.toHaveProperty('userId');
  });

  it('supports mock create, package change, cancellation, and activation paths', async () => {
    const created = await mockCustomerSubscriptionService.createSubscription({
      customerId: 'u4',
      packageId: 'basic',
    });
    expect(created).toMatchObject({ customerId: 'u4', status: 'pending' });

    const changed = await mockCustomerSubscriptionService.changePackage(
      'sub-u1',
      { packageId: 'plus' },
    );
    expect(changed.package.id).toBe('plus');

    const cancelled =
      await mockCustomerSubscriptionService.cancelSubscription('sub-u3');
    expect(cancelled.status).toBe('cancelled');

    mockSystemRepository.reset();
    const activated =
      await mockCustomerSubscriptionService.activateSubscription('sub-u3');
    expect(activated.status).toBe('active');
  });
});
