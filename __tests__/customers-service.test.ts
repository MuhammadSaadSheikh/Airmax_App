jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
  },
}));

import { mapCustomerDetail } from '@/services/api/customers.mapper';
import { mockCustomers } from '@/services/api/customers.mock';
import { customersService } from '@/services/api/customers.service';

describe('Phase 3B-1 customer operations service', () => {
  it('returns read-only customer list domain models', async () => {
    const customers = await customersService.list();

    expect(customers.length).toBeGreaterThan(0);
    expect(customers[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        status: expect.stringMatching(/active|pending|suspended|disabled/),
      }),
    );
    expect(customers.every(customer => !('role' in customer))).toBe(true);
  });

  it('searches by customer identity fields', async () => {
    await expect(
      customersService.list({ search: 'AMX-1188' }),
    ).resolves.toEqual([expect.objectContaining({ name: 'Sara Ali' })]);
  });

  it('returns mapped customer detail and latest subscription', async () => {
    const customer = await customersService.getById('u1');

    expect(customer.status).toBe('active');
    expect(customer.latestSubscription).toEqual(
      expect.objectContaining({
        status: 'active',
        package: expect.objectContaining({ price: 3500, speedMbps: 100 }),
      }),
    );
  });

  it('normalizes unsafe router and package values', () => {
    const source = mockCustomers[0]!;
    const mapped = mapCustomerDetail({
      ...source,
      routerDetails: ['unexpected'],
      subscriptions: [
        {
          ...source.subscriptions[0]!,
          package: { ...source.subscriptions[0]!.package, price: 'invalid' },
        },
      ],
    });

    expect(mapped.routerDetails).toBeNull();
    expect(mapped.latestSubscription?.package.price).toBe(0);
  });

  it('rejects an unknown mock customer', async () => {
    await expect(customersService.getById('missing')).rejects.toThrow(
      'Customer not found',
    );
  });
});
