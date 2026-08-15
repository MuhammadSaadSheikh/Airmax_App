import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  Divider,
  ErrorState,
  Row,
  SkeletonCard,
  Surface,
} from '@/components';
import { PaymentStatusBadge } from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { adminBillingService } from '@/services/api';
import { queryKeys } from '@/services/query';
import { colors, money, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'PaymentDetail'>;

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function PaymentDetailScreen({ route }: Props) {
  const paymentId = route.params.id;
  const paymentQuery = useQuery({
    queryKey: queryKeys.adminPaymentDetail(paymentId),
    queryFn: () => adminBillingService.getPaymentById(paymentId),
  });

  if (paymentQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Payment details" showBack />
        <SkeletonCard lines={6} />
      </AppScreen>
    );
  }

  if (paymentQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Payment details" showBack />
        <ErrorState
          title="Payment unavailable"
          message="This payment record could not be loaded."
          retry={() => void paymentQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const payment = paymentQuery.data;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Payment details"
        subtitle={payment.reference}
        showBack
      />
      <Surface style={styles.card}>
        <View style={styles.header}>
          <PaymentStatusBadge status={payment.status} />
          <AppText style={styles.amount}>{money(payment.amount)}</AppText>
        </View>
        <Divider />
        <Row
          icon="finger-print-outline"
          title="Payment ID"
          subtitle={payment.id}
        />
        <Divider />
        <Row
          icon="receipt-outline"
          title="Invoice"
          subtitle={payment.invoiceNumber}
        />
        <Divider />
        <Row
          icon="person-outline"
          title="Customer"
          subtitle={payment.customer.name}
        />
        <Divider />
        <Row
          icon="card-outline"
          title="Payment method"
          subtitle={payment.method.replaceAll('_', ' ')}
        />
        <Divider />
        <Row
          icon="calendar-outline"
          title="Created"
          subtitle={displayDate(payment.createdAt)}
        />
        {payment.failureReason ? (
          <>
            <Divider />
            <Row
              icon="alert-circle-outline"
              title="Failure reason"
              subtitle={payment.failureReason}
            />
          </>
        ) : null}
      </Surface>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  card: { marginTop: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amount: { ...typography.screenTitle, color: colors.text },
});
