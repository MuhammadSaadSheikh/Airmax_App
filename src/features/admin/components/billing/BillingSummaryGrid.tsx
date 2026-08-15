import { StyleSheet, View } from 'react-native';
import { StatCard } from '@/components';
import type { AdminBillingSummary } from '@/services/api/billing.models';
import { colors, money, spacing } from '@/theme';

export function BillingSummaryGrid({
  summary,
}: {
  summary: AdminBillingSummary;
}) {
  return (
    <View style={styles.grid}>
      <StatCard
        icon="receipt-outline"
        label="Total revenue"
        value={money(summary.totalRevenue)}
        color={colors.primary}
      />
      <StatCard
        icon="checkmark-circle-outline"
        label="Collected payments"
        value={money(summary.collectedPayments)}
        color={colors.success}
      />
      <StatCard
        icon="time-outline"
        label="Pending payments"
        value={money(summary.pendingPayments)}
        color={colors.warning}
      />
      <StatCard
        icon="alert-circle-outline"
        label="Overdue amount"
        value={money(summary.overdueAmount)}
        color={colors.danger}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
});
