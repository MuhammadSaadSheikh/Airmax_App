import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type { DashboardTrendPoint } from '@/services/api/reports.service';
import { colors, money, radius, spacing, typography } from '@/theme';

export function RevenueTrendCard({
  currentRevenue,
  trend,
}: {
  currentRevenue: number;
  trend: DashboardTrendPoint[];
}) {
  const maximum = Math.max(...trend.map(point => point.value), 1);

  return (
    <Surface>
      <View style={styles.header}>
        <View>
          <AppText style={styles.label}>CURRENT MONTH</AppText>
          <AppText style={styles.value}>{money(currentRevenue)}</AppText>
        </View>
        <AppText style={styles.mockLabel}>TREND PREVIEW</AppText>
      </View>
      <View style={styles.chart}>
        {trend.map(point => (
          <View key={point.label} style={styles.column}>
            <View
              style={[
                styles.bar,
                { height: Math.max(12, (point.value / maximum) * 88) },
              ]}
            />
            <AppText style={styles.axisLabel}>{point.label}</AppText>
          </View>
        ))}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { ...typography.small, color: colors.muted },
  value: {
    ...typography.screenTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  mockLabel: {
    ...typography.small,
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
  chart: {
    height: 124,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
  },
  column: { alignItems: 'center', gap: spacing.sm },
  bar: {
    width: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  axisLabel: { ...typography.small, color: colors.muted },
});
