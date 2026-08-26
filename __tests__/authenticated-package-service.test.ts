const mockGetPackages = jest.fn();
const mockGetPackageById = jest.fn();
const mockGetCustomerSubscriptions = jest.fn();

jest.mock('../src/services/api/package/package.service', () => ({
  packageCatalogService: {
    getPackages: (...args: unknown[]) => mockGetPackages(...args),
    getPackageById: (...args: unknown[]) => mockGetPackageById(...args),
  },
}));

jest.mock('../src/services/api/subscription/subscription.service', () => ({
  customerSubscriptionService: {
    getCustomerSubscriptions: (...args: unknown[]) =>
      mockGetCustomerSubscriptions(...args),
  },
}));

import { authenticatedPackageService } from '../src/services/package/authenticatedPackageService';

const basicPackage = {
  id: 'basic',
  name: 'Basic',
  speed: 20,
  price: 1500,
  billingCycle: 'monthly',
  features: [],
  benefits: [],
  usersSupported: 2,
  isRecommended: false,
  category: 'basic',
  description: 'Basic package',
  faqs: [],
} as const;

const premiumPackage = {
  ...basicPackage,
  id: 'premium',
  name: 'Premium',
  speed: 100,
  price: 3500,
  usersSupported: 8,
  isRecommended: true,
  category: 'premium',
} as const;

const subscription = {
  id: 'subscription-1',
  customerId: 'customer-1',
  packageId: premiumPackage.id,
  status: 'active',
  startsAt: '2026-08-01T00:00:00.000Z',
  endsAt: '2026-09-01T00:00:00.000Z',
  cancelledAt: null,
  package: premiumPackage,
  history: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
} as const;

describe('authenticated customer package presentation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPackages.mockResolvedValue([basicPackage, premiumPackage]);
    mockGetPackageById.mockResolvedValue(premiumPackage);
    mockGetCustomerSubscriptions.mockResolvedValue([subscription]);
  });

  it('builds current package state from Customer-owned subscriptions', async () => {
    await expect(
      authenticatedPackageService.getCurrentPackage('customer-1'),
    ).resolves.toMatchObject({
      package: { id: 'premium' },
      subscription: {
        id: 'subscription-1',
        customerId: 'customer-1',
        packageId: 'premium',
      },
    });
    expect(mockGetCustomerSubscriptions).toHaveBeenCalledWith('customer-1');
  });

  it('returns no current package when the backend has no live subscription', async () => {
    mockGetCustomerSubscriptions.mockResolvedValue([]);
    await expect(
      authenticatedPackageService.getCurrentPackage('customer-1'),
    ).resolves.toBeNull();
  });

  it('derives comparison and recommendation views without storing authority', async () => {
    const comparison = await authenticatedPackageService.comparePackages([
      'basic',
      'premium',
    ]);
    const recommendations =
      await authenticatedPackageService.getRecommendations('customer-1');

    expect(comparison.packages).toEqual([basicPackage, premiumPackage]);
    expect(comparison.comparisonFeatures).toHaveLength(5);
    expect(recommendations.map(item => item.packageId)).toEqual(['basic']);
  });
});
