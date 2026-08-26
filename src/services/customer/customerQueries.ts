import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { customerService } from '@/services/api/customer/customer.service';
import type { UpdateCustomerProfileInput } from '@/services/api/customer/customer.models';
import { queryKeys } from '@/services/query/queryKeys';

export function customerProfileQueryOptions() {
  return {
    queryKey: queryKeys.customerProfile,
    queryFn: () => customerService.getCurrentCustomer(),
  } as const;
}

export function customerDetailQueryOptions(id: string) {
  return {
    queryKey: queryKeys.customerDetail(id),
    queryFn: () => customerService.getCustomerById(id),
  } as const;
}

export async function invalidateCustomerQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.customerProfiles }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customerDetails }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customerDashboards }),
  ]);
}

export function useCustomerProfile() {
  return useQuery(customerProfileQueryOptions());
}

export function useCustomerDetail(id: string) {
  return useQuery(customerDetailQueryOptions(id));
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      input,
    }: {
      customerId: string;
      input: UpdateCustomerProfileInput;
    }) => customerService.updateCustomer(customerId, input),
    onSuccess: () => invalidateCustomerQueries(queryClient),
  });
}
