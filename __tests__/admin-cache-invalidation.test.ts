jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { QueryClient } from '@tanstack/react-query';
import { invalidateAdminMutation, queryKeys } from '@/services/query';

describe('Phase 3 admin cache invalidation policy', () => {
  it.each([
    [
      'customer',
      [
        queryKeys.adminCustomers,
        queryKeys.adminSubscriptions,
        queryKeys.adminDashboard,
      ],
    ],
    [
      'package',
      [
        queryKeys.adminPackages,
        queryKeys.adminCustomerPackageOptions,
        queryKeys.packageMarketplace,
      ],
    ],
    [
      'subscription',
      [
        queryKeys.adminSubscriptions,
        queryKeys.adminCustomers,
        queryKeys.adminPackages,
        queryKeys.adminBilling,
        queryKeys.adminDashboard,
      ],
    ],
    ['billing', [queryKeys.adminBilling, queryKeys.adminDashboard]],
    [
      'complaint',
      [
        queryKeys.adminComplaints,
        queryKeys.supportComplaintsRoot,
        queryKeys.adminDashboard,
      ],
    ],
  ] as const)(
    'invalidates the documented %s dependencies',
    async (scope, expected) => {
      const queryClient = new QueryClient();
      const invalidate = jest
        .spyOn(queryClient, 'invalidateQueries')
        .mockResolvedValue(undefined);

      await invalidateAdminMutation(queryClient, scope);

      expect(invalidate.mock.calls.map(call => call[0]?.queryKey)).toEqual(
        expected,
      );
    },
  );
});
