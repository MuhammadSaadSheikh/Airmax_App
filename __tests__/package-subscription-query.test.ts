const mockGetPackages = jest.fn();
const mockGetPackageById = jest.fn();
const mockGetCustomerSubscriptions = jest.fn();
const mockGetSubscriptionById = jest.fn();

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
    getSubscriptionById: (...args: unknown[]) =>
      mockGetSubscriptionById(...args),
  },
}));

import { QueryClient } from '@tanstack/react-query';
import {
  packageDetailQueryOptions,
  packageListQueryOptions,
} from '../src/services/package/packageQueries';
import {
  customerSubscriptionsQueryOptions,
  invalidateSubscriptionQueries,
  subscriptionDetailQueryOptions,
} from '../src/services/subscription/subscriptionQueries';
import { queryKeys } from '../src/services/query/queryKeys';

const packageItem = {
  id: 'package-1',
  name: 'Premium',
  speed: 100,
  price: 3500,
  billingCycle: 'monthly',
  features: [],
  benefits: [],
  usersSupported: 8,
  isRecommended: true,
  category: 'premium',
  description: 'Premium package',
  faqs: [],
} as const;

const subscription = {
  id: 'subscription-1',
  customerId: 'customer-1',
  packageId: packageItem.id,
  status: 'active',
  startsAt: '2026-08-01T00:00:00.000Z',
  endsAt: '2026-09-01T00:00:00.000Z',
  cancelledAt: null,
  package: packageItem,
  history: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
} as const;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('Phase 4.4D package and subscription React Query integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPackages.mockResolvedValue([packageItem]);
    mockGetPackageById.mockResolvedValue(packageItem);
    mockGetCustomerSubscriptions.mockResolvedValue([subscription]);
    mockGetSubscriptionById.mockResolvedValue(subscription);
  });

  it('loads package list and details through production query boundaries', async () => {
    const client = createQueryClient();
    await expect(client.fetchQuery(packageListQueryOptions())).resolves.toEqual(
      [packageItem],
    );
    await expect(
      client.fetchQuery(packageDetailQueryOptions(packageItem.id)),
    ).resolves.toEqual(packageItem);
    client.clear();
  });

  it('loads Customer-owned subscription list and detail queries', async () => {
    const client = createQueryClient();
    await expect(
      client.fetchQuery(customerSubscriptionsQueryOptions('customer-1')),
    ).resolves.toEqual([subscription]);
    await expect(
      client.fetchQuery(subscriptionDetailQueryOptions(subscription.id)),
    ).resolves.toEqual(subscription);
    client.clear();
  });

  it('exposes loading and failure states without local fallback authority', async () => {
    const client = createQueryClient();
    let rejectRequest!: (reason: Error) => void;
    mockGetPackages.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
    );
    const request = client.fetchQuery(packageListQueryOptions());
    expect(client.getQueryState(queryKeys.packageMarketplace)?.status).toBe(
      'pending',
    );
    const error = new Error('Package catalogue unavailable');
    rejectRequest(error);
    await expect(request).rejects.toBe(error);
    client.clear();
  });

  it('invalidates subscription, customer, and dashboard caches after mutations', async () => {
    const client = createQueryClient();
    client.setQueryData(queryKeys.customerSubscriptions('customer-1'), [
      subscription,
    ]);
    client.setQueryData(
      queryKeys.customerSubscriptionDetail(subscription.id),
      subscription,
    );
    client.setQueryData(queryKeys.currentPackage('customer-1'), subscription);
    client.setQueryData(queryKeys.customerProfile, { id: 'customer-1' });
    client.setQueryData(queryKeys.customerDashboard('AMX-1'), {});

    await invalidateSubscriptionQueries(client);

    expect(
      client.getQueryState(queryKeys.customerSubscriptions('customer-1'))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(
        queryKeys.customerSubscriptionDetail(subscription.id),
      )?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(queryKeys.currentPackage('customer-1'))
        ?.isInvalidated,
    ).toBe(true);
    expect(client.getQueryState(queryKeys.customerProfile)?.isInvalidated).toBe(
      true,
    );
    expect(
      client.getQueryState(queryKeys.customerDashboard('AMX-1'))?.isInvalidated,
    ).toBe(true);
    client.clear();
  });

  it('refetches subscription queries after invalidation', async () => {
    const client = createQueryClient();
    const options = customerSubscriptionsQueryOptions('customer-1');
    await client.fetchQuery(options);
    await invalidateSubscriptionQueries(client);
    await client.fetchQuery(options);
    expect(mockGetCustomerSubscriptions).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
