jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
  },
}));

import { mockCustomerService } from '@/services/api/customer/customer.mock.service';
import { mockSystemRepository } from '@/services/api/mockSystem.repository';

describe('Phase 4.4C mock Customer service compatibility', () => {
  beforeEach(() => mockSystemRepository.reset());

  it('maps the existing mock repository into the Customer domain model', async () => {
    await expect(mockCustomerService.getCurrentCustomer()).resolves.toEqual(
      expect.objectContaining({
        id: 'u1',
        accountNumber: 'AMX-1042',
        name: 'Ahmed Khan',
        status: 'active',
        address: 'DHA Phase 6, Karachi',
      }),
    );
  });

  it('updates Customer fields while preserving User-owned identity fields', async () => {
    const before = await mockCustomerService.getCustomerById('u1');
    const updated = await mockCustomerService.updateCustomer('u1', {
      name: 'Ahmed Updated',
      address: 'Updated service address',
    });

    expect(updated).toMatchObject({
      name: 'Ahmed Updated',
      address: 'Updated service address',
      phone: before.phone,
      email: before.email,
    });
  });
});
