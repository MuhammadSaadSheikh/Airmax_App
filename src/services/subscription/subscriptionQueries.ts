import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { customerSubscriptionService } from '@/services/api/subscription/subscription.service';
import type {
  ChangeSubscriptionPackageInput,
  CreateSubscriptionInput,
} from '@/services/api/subscription/subscription.models';
import { queryKeys } from '@/services/query/queryKeys';

export function customerSubscriptionsQueryOptions(customerId: string) {
  return {
    queryKey: queryKeys.customerSubscriptions(customerId),
    queryFn: () =>
      customerSubscriptionService.getCustomerSubscriptions(customerId),
    staleTime: 60_000,
  } as const;
}

export function subscriptionDetailQueryOptions(id: string) {
  return {
    queryKey: queryKeys.customerSubscriptionDetail(id),
    queryFn: () => customerSubscriptionService.getSubscriptionById(id),
    staleTime: 60_000,
  } as const;
}

export async function invalidateSubscriptionQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.customerSubscriptionsRoot,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.customerSubscriptionDetails,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.currentPackages }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.packageRecommendations,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customerDashboards }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customerProfiles }),
  ]);
}

export function useCustomerSubscriptions(customerId: string | undefined) {
  return useQuery({
    ...customerSubscriptionsQueryOptions(customerId ?? 'pending'),
    enabled: Boolean(customerId),
  });
}

export function useSubscriptionDetail(id: string) {
  return useQuery(subscriptionDetailQueryOptions(id));
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) =>
      customerSubscriptionService.createSubscription(input),
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}

export function useChangeSubscriptionPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      input,
    }: {
      subscriptionId: string;
      input: ChangeSubscriptionPackageInput;
    }) => customerSubscriptionService.changePackage(subscriptionId, input),
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      reason,
    }: {
      subscriptionId: string;
      reason?: string;
    }) =>
      customerSubscriptionService.cancelSubscription(subscriptionId, reason),
    onSuccess: () => invalidateSubscriptionQueries(queryClient),
  });
}
