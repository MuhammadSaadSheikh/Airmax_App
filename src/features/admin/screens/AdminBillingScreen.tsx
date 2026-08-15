import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import { environment } from '@/config/environment';
import { billingPermissions } from '@/features/admin/billing.permissions';
import {
  BillingFilterBar,
  BillingMockNotice,
  BillingSummaryGrid,
  InvoiceListItem,
  InvoiceListSkeleton,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { adminBillingService } from '@/services/api';
import type {
  AdminInvoice,
  InvoiceStatusFilter,
  PaymentStatusFilter,
} from '@/services/api/billing.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

const emptyInvoices: AdminInvoice[] = [];

export function filterAdminInvoices(
  invoices: AdminInvoice[],
  search: string,
  invoiceStatus: InvoiceStatusFilter,
  paymentStatus: PaymentStatusFilter,
): AdminInvoice[] {
  const term = search.trim().toLowerCase();
  return invoices.filter(invoice => {
    const matchesInvoice =
      invoiceStatus === 'all' || invoice.status === invoiceStatus;
    const matchesPayment =
      paymentStatus === 'all' ||
      (paymentStatus === 'no_payment'
        ? invoice.payments.length === 0
        : invoice.payments.some(payment => payment.status === paymentStatus));
    const searchable = [
      invoice.invoiceNumber,
      invoice.customer.name,
      invoice.customer.connectionId ?? '',
      invoice.subscription.id,
      invoice.subscription.packageName,
    ]
      .join(' ')
      .toLowerCase();
    return matchesInvoice && matchesPayment && searchable.includes(term);
  });
}

export default function AdminBillingScreen() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [invoiceStatus, setInvoiceStatus] =
    useState<InvoiceStatusFilter>('all');
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusFilter>('all');
  const invoicesQuery = useQuery({
    queryKey: queryKeys.adminInvoiceList,
    queryFn: adminBillingService.getInvoices,
    enabled: billingPermissions.canViewBilling,
  });
  const summaryQuery = useQuery({
    queryKey: queryKeys.adminBillingSummary,
    queryFn: adminBillingService.getBillingSummary,
    enabled: billingPermissions.canViewBilling,
  });

  const invoices = invoicesQuery.data ?? emptyInvoices;
  const filteredInvoices = useMemo(
    () => filterAdminInvoices(invoices, search, invoiceStatus, paymentStatus),
    [invoiceStatus, invoices, paymentStatus, search],
  );

  const renderInvoice = useCallback(
    ({ item }: { item: AdminInvoice }) => (
      <InvoiceListItem
        invoice={item}
        onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}
      />
    ),
    [navigation],
  );

  if (!billingPermissions.canViewBilling) {
    return (
      <AppScreen>
        <AppHeader title="Billing operations" showBack />
        <ErrorState
          title="Billing access unavailable"
          message="Your account cannot view financial operations."
        />
      </AppScreen>
    );
  }

  const refresh = async () => {
    await Promise.all([invoicesQuery.refetch(), summaryQuery.refetch()]);
  };

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Billing operations"
        subtitle="Invoices, collections and payment controls"
        showBack
      />
      {environment.useMockApi ? (
        <View style={styles.notice}>
          <BillingMockNotice />
        </View>
      ) : null}
      {invoicesQuery.isPending || summaryQuery.isPending ? (
        <InvoiceListSkeleton />
      ) : invoicesQuery.isError || summaryQuery.isError ? (
        <ErrorState
          title="Billing unavailable"
          message="We couldn’t load finance operations data."
          retry={() => void refresh()}
        />
      ) : (
        <>
          <BillingSummaryGrid summary={summaryQuery.data} />
          <BillingFilterBar
            search={search}
            invoiceStatus={invoiceStatus}
            paymentStatus={paymentStatus}
            onSearchChange={setSearch}
            onInvoiceStatusChange={setInvoiceStatus}
            onPaymentStatusChange={setPaymentStatus}
          />
          <FlatList
            style={styles.list}
            data={filteredInvoices}
            keyExtractor={item => item.id}
            renderItem={renderInvoice}
            ItemSeparatorComponent={ListSeparator}
            ListEmptyComponent={
              <EmptyState
                title="No invoices found"
                message="Try a different search or billing filter."
                icon="receipt-outline"
              />
            }
            contentContainerStyle={[
              styles.content,
              filteredInvoices.length === 0 && styles.empty,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshing={invoicesQuery.isRefetching || summaryQuery.isRefetching}
            onRefresh={() => void refresh()}
            initialNumToRender={10}
            windowSize={7}
          />
        </>
      )}
    </AppScreen>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notice: { marginBottom: spacing.lg },
  list: { flex: 1 },
  content: { paddingBottom: spacing.huge },
  empty: { flexGrow: 1 },
  separator: { height: spacing.md },
});
