import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { complaintApiService } from '@/services/api/complaint/complaint.service';
import { technicianVisibilityApiService } from '@/services/api/technician/technician.service';
import { workOrderTrackingApiService } from '@/services/api/workOrder/workOrder.service';
import { queryKeys } from '@/services/query/queryKeys';
import type { CreateComplaintInput } from './models';

export function customerComplaintsQueryOptions(customerId: string) {
  return {
    queryKey: queryKeys.supportComplaints(customerId),
    queryFn: () => complaintApiService.getCustomerComplaints(customerId),
    staleTime: 30_000,
  } as const;
}

export function complaintDetailQueryOptions(
  customerId: string,
  complaintId: string,
) {
  return {
    queryKey: queryKeys.supportComplaintDetail(customerId, complaintId),
    queryFn: () => complaintApiService.getComplaintById(complaintId),
    staleTime: 30_000,
  } as const;
}

export function complaintTechnicianQueryOptions(complaintId: string) {
  return {
    queryKey: queryKeys.supportComplaintTechnician(complaintId),
    queryFn: () =>
      technicianVisibilityApiService.getComplaintTechnician(complaintId),
    staleTime: 30_000,
  } as const;
}

export function workOrderTrackingQueryOptions(workOrderId: string) {
  return {
    queryKey: queryKeys.customerWorkOrderDetail(workOrderId),
    queryFn: () => workOrderTrackingApiService.getWorkOrderById(workOrderId),
    staleTime: 15_000,
  } as const;
}

export async function invalidateSupportQueries(
  queryClient: QueryClient,
  input: {
    customerId: string;
    complaintId?: string;
    workOrderId?: string;
    connectionId?: string | null;
  },
): Promise<void> {
  const keys: Array<readonly unknown[]> = [
    queryKeys.supportComplaintsRoot,
    queryKeys.supportComplaints(input.customerId),
    queryKeys.supportComplaintDetailsRoot,
    queryKeys.customerDashboards,
  ];
  if (input.complaintId) {
    keys.push(
      queryKeys.supportComplaintDetail(input.customerId, input.complaintId),
      queryKeys.supportComplaintTechnician(input.complaintId),
    );
  }
  if (input.workOrderId) {
    keys.push(queryKeys.customerWorkOrderDetail(input.workOrderId));
  }
  await Promise.all(
    keys.map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
  if (input.connectionId) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.customerDashboard(input.connectionId),
    });
  }
}

export function useCustomerComplaints(customerId: string | undefined) {
  return useQuery({
    ...customerComplaintsQueryOptions(customerId ?? 'pending'),
    enabled: Boolean(customerId),
  });
}

export function useComplaintDetail(
  customerId: string | undefined,
  complaintId: string,
) {
  return useQuery({
    ...complaintDetailQueryOptions(customerId ?? 'pending', complaintId),
    enabled: Boolean(customerId),
  });
}

export function useComplaintTechnician(complaintId: string, enabled: boolean) {
  return useQuery({
    ...complaintTechnicianQueryOptions(complaintId),
    enabled,
  });
}

export function useWorkOrderTracking(
  workOrderId: string | undefined,
  enabled = true,
) {
  return useQuery({
    ...workOrderTrackingQueryOptions(workOrderId ?? 'pending'),
    enabled: enabled && Boolean(workOrderId),
  });
}

export function useCreateComplaint(
  customerId: string | undefined,
  connectionId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateComplaintInput) =>
      complaintApiService.createComplaint(input),
    onSuccess: complaint =>
      invalidateSupportQueries(queryClient, {
        customerId: customerId ?? 'pending',
        complaintId: complaint.id,
        connectionId,
      }),
  });
}
