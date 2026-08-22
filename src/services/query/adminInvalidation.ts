import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

type AdminMutationScope =
  'customer' | 'package' | 'subscription' | 'billing' | 'complaint';

/**
 * Central Phase 3 invalidation policy. Mutations deliberately refetch instead
 * of applying optimistic updates because several screens expose shared
 * repository aggregates and historical snapshots.
 */
export async function invalidateAdminMutation(
  queryClient: QueryClient,
  scope: AdminMutationScope,
): Promise<void> {
  const keys = {
    customer: [
      queryKeys.adminCustomers,
      queryKeys.adminSubscriptions,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
      queryKeys.customerDashboards,
      queryKeys.currentPackages,
    ],
    package: [
      queryKeys.adminPackages,
      queryKeys.adminCustomerPackageOptions,
      queryKeys.packageMarketplace,
      queryKeys.packageDetails,
      queryKeys.packageComparison,
      queryKeys.packageRecommendations,
      queryKeys.adminReports,
    ],
    subscription: [
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
    billing: [
      queryKeys.adminBilling,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
      queryKeys.currentBills,
      queryKeys.customerInvoices,
      queryKeys.customerInvoiceDetails,
      queryKeys.paymentHistories,
    ],
    complaint: [
      queryKeys.adminComplaints,
      queryKeys.supportComplaintsRoot,
      queryKeys.supportComplaintDetailsRoot,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ],
  } satisfies Record<AdminMutationScope, readonly (readonly unknown[])[]>;

  await Promise.all(
    keys[scope].map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
}

export async function invalidateTechnicianAssignment(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all(
    [
      queryKeys.adminComplaints,
      queryKeys.supportComplaintsRoot,
      queryKeys.supportComplaintDetailsRoot,
      queryKeys.adminTechnicians,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
}

export async function invalidateTechnicianStatus(
  queryClient: QueryClient,
  technicianId: string,
): Promise<void> {
  await Promise.all(
    [
      queryKeys.adminTechnicianList,
      queryKeys.adminTechnicianDetail(technicianId),
      queryKeys.adminTechnicianWorkload(technicianId),
      queryKeys.adminTechnicianHistory(technicianId),
      queryKeys.adminComplaintTechnicians,
      queryKeys.adminReports,
    ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
}

export async function invalidateTechnicianWorkOrder(
  queryClient: QueryClient,
  technicianId: string,
  complaintId: string,
): Promise<void> {
  await Promise.all(
    [
      queryKeys.adminTechnicians,
      queryKeys.adminTechnicianDetail(technicianId),
      queryKeys.adminTechnicianWorkload(technicianId),
      queryKeys.adminComplaintDetail(complaintId),
      queryKeys.adminComplaintList,
      queryKeys.supportComplaintsRoot,
      queryKeys.supportComplaintDetailsRoot,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
}
