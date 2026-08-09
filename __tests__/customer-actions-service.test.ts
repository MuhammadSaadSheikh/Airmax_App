jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
  },
}));

import { mockCustomerRepository } from '@/services/api/customers.mock.repository';
import { customersService } from '@/services/api/customers.service';

describe('Phase 3B-2 mock customer actions', () => {
  beforeEach(() => mockCustomerRepository.reset());

  it('activates the customer and latest subscription', async () => {
    const customer = await customersService.activateCustomer('u3');

    expect(customer.status).toBe('active');
    expect(customer.latestSubscription?.status).toBe('active');
  });

  it('suspends the customer and latest subscription with a reason', async () => {
    const customer = await customersService.suspendCustomer({
      customerId: 'u1',
      reason: 'non-payment',
    });

    expect(customer.status).toBe('suspended');
    expect(customer.latestSubscription?.status).toBe('suspended');
  });

  it('requires a package before activating a pending customer', async () => {
    await expect(customersService.activateCustomer('u4')).rejects.toThrow(
      'Select a package before activating this customer',
    );

    const assigned = await customersService.changePackage({
      customerId: 'u4',
      packageId: 'plus',
    });
    expect(assigned.latestSubscription?.package.id).toBe('plus');
    expect(assigned.latestSubscription?.status).toBe('pending');

    const activated = await customersService.activateCustomer('u4');
    expect(activated.status).toBe('active');
    expect(activated.latestSubscription?.status).toBe('active');
  });

  it('preserves subscription identity when changing package', async () => {
    const before = await customersService.getById('u1');
    const updated = await customersService.changePackage({
      customerId: 'u1',
      packageId: 'ultra',
    });

    expect(updated.latestSubscription?.id).toBe(before.latestSubscription?.id);
    expect(updated.latestSubscription?.startsAt).toBe(
      before.latestSubscription?.startsAt,
    );
    expect(updated.latestSubscription?.expiresAt).toBe(
      before.latestSubscription?.expiresAt,
    );
    expect(updated.latestSubscription?.package.name).toBe('Ultra Fiber');
  });

  it('updates approved customer information fields', async () => {
    const updated = await customersService.updateCustomerInformation({
      customerId: 'u1',
      name: 'Ahmed Updated',
      phone: '+92 300 1111111',
      email: 'updated@example.com',
      address: 'Updated address',
      cnic: '42101-1111111-1',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        name: 'Ahmed Updated',
        phone: '+92 300 1111111',
        email: 'updated@example.com',
        address: 'Updated address',
        cnic: '42101-1111111-1',
      }),
    );
  });

  it.each([
    ['phone', { phone: '+92 321 9876543' }],
    ['email', { email: 'sara@example.com' }],
    ['CNIC', { cnic: '42101-7654321-2' }],
  ] as const)('rejects a duplicate %s', async (label, duplicate) => {
    await expect(
      customersService.updateCustomerInformation({
        customerId: 'u1',
        name: 'Ahmed Khan',
        phone: '+92 300 1234567',
        email: 'ahmed@example.com',
        address: 'DHA Phase 6, Karachi',
        cnic: '42101-1234567-1',
        ...duplicate,
      }),
    ).rejects.toThrow(`A customer with this ${label} already exists`);
  });

  it('returns the approved mock package catalogue', async () => {
    const packages = await customersService.listPackageOptions();

    expect(packages.map(item => item.name)).toEqual([
      'Basic',
      'Air Plus',
      'Premium',
      'Ultra Fiber',
    ]);
  });
});
