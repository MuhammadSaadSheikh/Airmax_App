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
    ],
    package: [
      queryKeys.adminPackages,
      queryKeys.adminCustomerPackageOptions,
      queryKeys.packageMarketplace,
      queryKeys.adminReports,
    ],
    subscription: [
      queryKeys.adminSubscriptions,
      queryKeys.adminCustomers,
      queryKeys.adminPackages,
      queryKeys.adminBilling,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ],
    billing: [
      queryKeys.adminBilling,
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ],
    complaint: [
      queryKeys.adminComplaints,
      queryKeys.supportComplaintsRoot,
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
      queryKeys.adminDashboard,
      queryKeys.adminReports,
    ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
}
