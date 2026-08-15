import { StyleSheet, View } from 'react-native';
import { AppText, EmptyState, Surface } from '@/components';
import type { AdminPayment } from '@/services/api/billing.models';
import { colors, money, spacing, typography } from '@/theme';
import { AnimatedPressable } from '@/utils/animations';
import { PaymentStatusBadge } from './PaymentStatusBadge';

function methodLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function PaymentHistoryList({
  payments,
  onPaymentPress,
}: {
  payments: AdminPayment[];
  onPaymentPress: (id: string) => void;
}) {
  if (payments.length === 0) {
    return (
      <Surface>
        <EmptyState
          title="No payment attempts"
          message="No payments have been recorded for this invoice."
          icon="card-outline"
        />
      </Surface>
    );
  }
  return (
    <View style={styles.list}>
      {payments.map(payment => (
        <AnimatedPressable
          key={payment.id}
          accessibilityRole="button"
          accessibilityLabel={`Open payment ${payment.id}`}
          onPress={() => onPaymentPress(payment.id)}
        >
          <Surface style={styles.payment}>
            <View style={styles.header}>
              <AppText style={styles.id}>{payment.reference}</AppText>
              <PaymentStatusBadge status={payment.status} />
            </View>
            <View style={styles.details}>
              <AppText style={styles.method}>
                {methodLabel(payment.method)}
              </AppText>
              <AppText style={styles.amount}>{money(payment.amount)}</AppText>
            </View>
          </Surface>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  payment: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  id: { ...typography.label, color: colors.primary },
  method: {
    ...typography.small,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  amount: { ...typography.label, color: colors.text },
});
