import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Row,
  SkeletonCard,
  Surface,
} from '@/components';
import { environment } from '@/config/environment';
import { billingPermissions } from '@/features/admin/billing.permissions';
import {
  createAdminConfirmation,
  runProtectedAdminAction,
} from '@/features/admin/security';
import {
  BillingActionPanel,
  BillingMockNotice,
  InvoiceCustomerCard,
  InvoiceStatusBadge,
  InvoiceSubscriptionCard,
  PaymentHistoryList,
  PaymentTimeline,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { adminBillingService } from '@/services/api';
import type { PaymentMethod } from '@/services/api/billing.models';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import { colors, money, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'InvoiceDetail'>;

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function billingPeriod(start: string, end: string): string {
  return `${displayDate(start)} – ${displayDate(end)}`;
}

export default function InvoiceDetailScreen({ navigation, route }: Props) {
  const invoiceId = route.params.id;
  const queryClient = useQueryClient();
  const invoiceQuery = useQuery({
    queryKey: queryKeys.adminInvoiceDetail(invoiceId),
    queryFn: () => adminBillingService.getInvoiceById(invoiceId),
  });

  const invalidateBilling = () =>
    invalidateAdminMutation(queryClient, 'billing');

  const recordMutation = useMutation({
    mutationFn: (method: PaymentMethod) =>
      runProtectedAdminAction(
        billingPermissions.canManagePayments,
        'record payment',
        'billing',
        () =>
          adminBillingService.recordPayment({
            invoiceId,
            amount: invoiceQuery.data!.amount,
            method,
          }),
      ),
    onSuccess: invalidateBilling,
  });
  const markPaidMutation = useMutation({
    mutationFn: () =>
      runProtectedAdminAction(
        billingPermissions.canManagePayments,
        'mark invoice paid',
        'billing',
        () => adminBillingService.markInvoicePaid(invoiceId),
      ),
    onSuccess: invalidateBilling,
  });
  const cancelMutation = useMutation({
    mutationFn: () =>
      runProtectedAdminAction(
        billingPermissions.canCancelInvoice,
        'cancel invoice',
        'billing',
        () => adminBillingService.cancelInvoice(invoiceId),
      ),
    onSuccess: invalidateBilling,
  });

  const choosePaymentMethod = () => {
    const methods: ReadonlyArray<{ label: string; value: PaymentMethod }> = [
      { label: 'Cash', value: 'cash' },
      { label: 'Bank transfer', value: 'bank_transfer' },
      { label: 'Card', value: 'card' },
      { label: 'Easypaisa', value: 'easypaisa' },
      { label: 'JazzCash', value: 'jazzcash' },
    ];
    Alert.alert('Record payment', 'Select the received payment method.', [
      ...methods.map(method => ({
        text: method.label,
        onPress: () => {
          const confirmation = createAdminConfirmation({
            actionName: `Record ${method.label} payment`,
            affectedEntity:
              invoiceQuery.data?.invoiceNumber ?? `invoice ${invoiceId}`,
            confirmLabel: 'Record payment',
            destructive: false,
            onConfirm: () => recordMutation.mutate(method.value),
          });
          Alert.alert(
            confirmation.title,
            confirmation.message,
            confirmation.buttons,
          );
        },
      })),
      { text: 'Back', style: 'cancel' as const },
    ]);
  };

  const confirmMarkPaid = () => {
    const confirmation = createAdminConfirmation({
      actionName: 'Mark invoice paid manually',
      affectedEntity:
        invoiceQuery.data?.invoiceNumber ?? `invoice ${invoiceId}`,
      confirmLabel: 'Mark paid',
      destructive: false,
      onConfirm: () => markPaidMutation.mutate(),
    });
    Alert.alert(confirmation.title, confirmation.message, confirmation.buttons);
  };

  const confirmCancel = () => {
    const confirmation = createAdminConfirmation({
      actionName: 'Cancel invoice',
      affectedEntity:
        invoiceQuery.data?.invoiceNumber ?? `invoice ${invoiceId}`,
      confirmLabel: 'Cancel invoice',
      onConfirm: () => cancelMutation.mutate(),
    });
    Alert.alert(confirmation.title, confirmation.message, confirmation.buttons);
  };

  if (invoiceQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Invoice details" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </View>
      </AppScreen>
    );
  }

  if (invoiceQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Invoice details" showBack />
        <ErrorState
          title="Invoice unavailable"
          message="This invoice record could not be loaded."
          retry={() => void invoiceQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const invoice = invoiceQuery.data;
  const mutationError =
    recordMutation.error ?? markPaidMutation.error ?? cancelMutation.error;
  const loading =
    recordMutation.isPending ||
    markPaidMutation.isPending ||
    cancelMutation.isPending;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Invoice details"
        subtitle={invoice.invoiceNumber}
        showBack
      />
      {environment.useMockApi ? <BillingMockNotice /> : null}

      <View style={styles.topCard}>
        <Surface>
          <View style={styles.statusRow}>
            <InvoiceStatusBadge status={invoice.status} />
            <AppText style={styles.amount}>{money(invoice.amount)}</AppText>
          </View>
          <View style={styles.invoiceRows}>
            <Row
              icon="calendar-outline"
              title="Billing period"
              subtitle={billingPeriod(
                invoice.billingPeriodStart,
                invoice.billingPeriodEnd,
              )}
            />
            <Row
              icon="time-outline"
              title="Due date"
              subtitle={displayDate(invoice.dueDate)}
            />
          </View>
        </Surface>
      </View>

      <SectionTitle title="Customer information" />
      <InvoiceCustomerCard customer={invoice.customer} />

      <SectionTitle title="Subscription and package snapshot" />
      <InvoiceSubscriptionCard subscription={invoice.subscription} />

      <SectionTitle title="Payment history" />
      <PaymentHistoryList
        payments={invoice.payments}
        onPaymentPress={id => navigation.navigate('PaymentDetail', { id })}
      />

      <SectionTitle title="Billing actions" />
      <BillingActionPanel
        status={invoice.status}
        loading={loading}
        canManagePayments={billingPermissions.canManagePayments}
        canCancelInvoice={billingPermissions.canCancelInvoice}
        onRecordPayment={choosePaymentMethod}
        onMarkPaid={confirmMarkPaid}
        onCancel={confirmCancel}
      />

      {mutationError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutationError instanceof Error
            ? mutationError.message
            : 'The billing action could not be completed.'}
        </AppText>
      ) : null}

      <SectionTitle title="Billing timeline" />
      <PaymentTimeline events={invoice.timeline} />
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  loading: { gap: spacing.lg },
  topCard: { marginTop: spacing.lg },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amount: { ...typography.screenTitle, color: colors.text },
  invoiceRows: { gap: spacing.md, marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
