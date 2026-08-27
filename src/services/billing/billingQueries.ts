import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { paymentApiService } from '@/services/api/payment/payment.service';
import { queryKeys } from '@/services/query/queryKeys';
import { billingCenterService } from './billingService';

export function currentBillQueryOptions(customerId: string) {
  return {
    queryKey: queryKeys.currentBill(customerId),
    queryFn: () => billingCenterService.getCurrentBill(customerId),
    staleTime: 30_000,
  } as const;
}

export function customerInvoicesQueryOptions(customerId: string) {
  return {
    queryKey: queryKeys.invoices(customerId),
    queryFn: () => billingCenterService.getInvoices(customerId),
    staleTime: 30_000,
  } as const;
}

export function invoiceDetailQueryOptions(id: string) {
  return {
    queryKey: queryKeys.invoiceDetail(id),
    queryFn: () => billingCenterService.getInvoice(id),
    staleTime: 30_000,
  } as const;
}

export function paymentHistoryQueryOptions(customerId: string) {
  return {
    queryKey: queryKeys.paymentHistory(customerId),
    queryFn: () => billingCenterService.getPaymentHistory(customerId),
    staleTime: 30_000,
  } as const;
}

export function paymentDetailQueryOptions(id: string) {
  return {
    queryKey: queryKeys.paymentDetail(id),
    queryFn: () => paymentApiService.getPaymentById(id),
    staleTime: 30_000,
  } as const;
}

export function paymentMethodsQueryOptions(customerId: string) {
  return {
    queryKey: queryKeys.paymentMethods(customerId),
    queryFn: () => billingCenterService.getPaymentMethods(customerId),
  } as const;
}

export async function invalidateBillingQueries(
  queryClient: QueryClient,
  input: {
    customerId: string;
    invoiceId: string;
    connectionId?: string | null;
  },
): Promise<void> {
  const keys: readonly (readonly unknown[])[] = [
    queryKeys.currentBills,
    queryKeys.currentBill(input.customerId),
    queryKeys.customerInvoices,
    queryKeys.invoices(input.customerId),
    queryKeys.invoiceDetail(input.invoiceId),
    queryKeys.paymentHistories,
    queryKeys.paymentHistory(input.customerId),
    queryKeys.paymentDetails,
    queryKeys.customerDashboards,
    queryKeys.bills,
  ];
  await Promise.all(
    keys.map(queryKey => queryClient.invalidateQueries({ queryKey })),
  );
  if (input.connectionId) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.customerDashboard(input.connectionId),
    });
  }
}

export function useCurrentBill(customerId: string | undefined) {
  return useQuery({
    ...currentBillQueryOptions(customerId ?? 'pending'),
    enabled: Boolean(customerId),
  });
}

export function useCustomerInvoices(customerId: string | undefined) {
  return useQuery({
    ...customerInvoicesQueryOptions(customerId ?? 'pending'),
    enabled: Boolean(customerId),
  });
}

export function useInvoiceDetail(id: string) {
  return useQuery(invoiceDetailQueryOptions(id));
}

export function usePaymentHistory(customerId: string | undefined) {
  return useQuery({
    ...paymentHistoryQueryOptions(customerId ?? 'pending'),
    enabled: Boolean(customerId),
  });
}

export function usePaymentDetail(id: string) {
  return useQuery(paymentDetailQueryOptions(id));
}

export function usePaymentMethods(customerId: string | undefined) {
  return useQuery({
    ...paymentMethodsQueryOptions(customerId ?? 'pending'),
    enabled: Boolean(customerId),
  });
}

export function useInitiatePayment(
  customerId: string | undefined,
  connectionId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      methodId,
      idempotencyKey,
    }: {
      invoiceId: string;
      methodId: string;
      idempotencyKey?: string;
    }) =>
      billingCenterService.processPayment(invoiceId, methodId, idempotencyKey),
    onSuccess: receipt =>
      invalidateBillingQueries(queryClient, {
        customerId: customerId ?? 'pending',
        invoiceId: receipt.invoiceId,
        connectionId,
      }),
  });
}
