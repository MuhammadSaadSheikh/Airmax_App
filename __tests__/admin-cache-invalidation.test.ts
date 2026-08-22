jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { QueryClient } from '@tanstack/react-query';
import {
  invalidateAdminMutation,
  invalidateTechnicianAssignment,
  invalidateTechnicianStatus,
  invalidateTechnicianWorkOrder,
  queryKeys,
} from '@/services/query';

function invalidationSpy(queryClient: QueryClient) {
  return jest
    .spyOn(queryClient, 'invalidateQueries')
    .mockResolvedValue(undefined);
}

describe('Phase 3 admin cache invalidation policy', () => {
  it.each([
    [
      'customer',
      [
        queryKeys.adminCustomers,
        queryKeys.adminSubscriptions,
        queryKeys.adminDashboard,
        queryKeys.adminReports,
        queryKeys.customerDashboards,
        queryKeys.currentPackages,
      ],
    ],
    [
      'package',
      [
        queryKeys.adminPackages,
        queryKeys.adminCustomerPackageOptions,
        queryKeys.packageMarketplace,
        queryKeys.packageDetails,
        queryKeys.packageComparison,
        queryKeys.packageRecommendations,
        queryKeys.adminReports,
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
        queryKeys.adminReports,
        queryKeys.customerDashboards,
        queryKeys.currentPackages,
        queryKeys.currentBills,
        queryKeys.customerInvoices,
      ],
    ],
    [
      'billing',
      [
        queryKeys.adminBilling,
        queryKeys.adminDashboard,
        queryKeys.adminReports,
        queryKeys.currentBills,
        queryKeys.customerInvoices,
        queryKeys.customerInvoiceDetails,
        queryKeys.paymentHistories,
      ],
    ],
    [
      'complaint',
      [
        queryKeys.adminComplaints,
        queryKeys.supportComplaintsRoot,
        queryKeys.supportComplaintDetailsRoot,
        queryKeys.adminDashboard,
        queryKeys.adminReports,
      ],
    ],
  ] as const)(
    'invalidates the documented %s dependencies',
    async (scope, expected) => {
      const queryClient = new QueryClient();
      const invalidate = invalidationSpy(queryClient);

      await invalidateAdminMutation(queryClient, scope);

      expect(invalidate.mock.calls.map(call => call[0]?.queryKey)).toEqual(
        expected,
      );
    },
  );

  it('invalidates complaint, customer and field-service caches after assignment', async () => {
    const queryClient = new QueryClient();
    const invalidate = invalidationSpy(queryClient);

    await invalidateTechnicianAssignment(queryClient);

    expect(invalidate.mock.calls.map(call => call[0]?.queryKey)).toEqual([
      queryKeys.adminComplaints,
      queryKeys.supportComplaintsRoot,
      queryKeys.supportComplaintDetailsRoot,
      queryKeys.adminTechnicians,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ]);
  });

  it('uses targeted technician invalidation for status changes', async () => {
    const queryClient = new QueryClient();
    const invalidate = invalidationSpy(queryClient);

    await invalidateTechnicianStatus(queryClient, 'tech-ali');

    expect(invalidate.mock.calls.map(call => call[0]?.queryKey)).toEqual([
      queryKeys.adminTechnicianList,
      queryKeys.adminTechnicianDetail('tech-ali'),
      queryKeys.adminTechnicianWorkload('tech-ali'),
      queryKeys.adminTechnicianHistory('tech-ali'),
      queryKeys.adminComplaintTechnicians,
      queryKeys.adminReports,
    ]);
  });

  it('refreshes both admin and customer complaint caches after work-order changes', async () => {
    const queryClient = new QueryClient();
    const invalidate = invalidationSpy(queryClient);

    await invalidateTechnicianWorkOrder(
      queryClient,
      'tech-ali',
      'complaint-2054',
    );

    expect(invalidate.mock.calls.map(call => call[0]?.queryKey)).toEqual([
      queryKeys.adminTechnicians,
      queryKeys.adminTechnicianDetail('tech-ali'),
      queryKeys.adminTechnicianWorkload('tech-ali'),
      queryKeys.adminComplaintDetail('complaint-2054'),
      queryKeys.adminComplaintList,
      queryKeys.supportComplaintsRoot,
      queryKeys.supportComplaintDetailsRoot,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ]);
  });
});
