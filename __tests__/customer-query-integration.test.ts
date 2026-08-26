const mockGetCurrentCustomer = jest.fn();
const mockGetCustomerById = jest.fn();

jest.mock('../src/services/api/customer/customer.service', () => ({
  customerService: {
    getCurrentCustomer: (...args: unknown[]) => mockGetCurrentCustomer(...args),
    getCustomerById: (...args: unknown[]) => mockGetCustomerById(...args),
    updateCustomer: jest.fn(),
    updateCustomerStatus: jest.fn(),
  },
}));

import { QueryClient } from '@tanstack/react-query';
import {
  customerDetailQueryOptions,
  customerProfileQueryOptions,
  invalidateCustomerQueries,
} from '../src/services/customer/customerQueries';
import { queryKeys } from '../src/services/query/queryKeys';

const customer = {
  id: 'customer-1',
  accountNumber: 'AIRMAX-1',
  name: 'Customer One',
  phone: '+923001234567',
  email: 'customer@example.test',
  status: 'active',
  address: 'Service address',
  billingAddress: null,
  cnic: null,
  connectionId: 'AMX-1',
  installationDate: null,
  router: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('Phase 4.4C Customer React Query integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentCustomer.mockResolvedValue(customer);
    mockGetCustomerById.mockResolvedValue(customer);
  });

  it('loads the current Customer through the customer profile query', async () => {
    const client = createQueryClient();
    await expect(
      client.fetchQuery(customerProfileQueryOptions()),
    ).resolves.toEqual(customer);
    expect(mockGetCurrentCustomer).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('exposes Customer query failures without local fallback authority', async () => {
    const client = createQueryClient();
    const error = new Error('Customer unavailable');
    mockGetCurrentCustomer.mockRejectedValue(error);
    await expect(client.fetchQuery(customerProfileQueryOptions())).rejects.toBe(
      error,
    );
    client.clear();
  });

  it('invalidates profile, details, and dashboard customer caches after update', async () => {
    const client = createQueryClient();
    client.setQueryData(queryKeys.customerProfile, customer);
    client.setQueryData(queryKeys.customerDetail(customer.id), customer);
    client.setQueryData(queryKeys.customerDashboard('AMX-1'), {
      customerId: customer.id,
    });

    await invalidateCustomerQueries(client);

    expect(client.getQueryState(queryKeys.customerProfile)?.isInvalidated).toBe(
      true,
    );
    expect(
      client.getQueryState(queryKeys.customerDetail(customer.id))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(queryKeys.customerDashboard('AMX-1'))?.isInvalidated,
    ).toBe(true);
    client.clear();
  });

  it('refetches invalidated profile and detail queries', async () => {
    const client = createQueryClient();
    await client.fetchQuery(customerProfileQueryOptions());
    await client.fetchQuery(customerDetailQueryOptions(customer.id));

    await invalidateCustomerQueries(client);
    await client.fetchQuery(customerProfileQueryOptions());
    await client.fetchQuery(customerDetailQueryOptions(customer.id));

    expect(mockGetCurrentCustomer).toHaveBeenCalledTimes(2);
    expect(mockGetCustomerById).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
