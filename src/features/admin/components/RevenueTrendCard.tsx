import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type {
  AnalyticsDataSource,
  DashboardTrendPoint,
} from '@/services/api/reports.models';
import { colors, money, radius, spacing, typography } from '@/theme';
import { AnalyticsSourceBadge } from './AnalyticsSourceBadge';

export function RevenueTrendCard({
  currentRevenue,
  trend,
  source,
}: {
  currentRevenue: number;
  trend: DashboardTrendPoint[];
  source: AnalyticsDataSource;
}) {
  const maximum = Math.max(...trend.map(point => point.value), 1);

  return (
    <Surface>
      <View style={styles.header}>
        <View>
          <AppText style={styles.label}>CURRENT MONTH</AppText>
          <AppText style={styles.value}>{money(currentRevenue)}</AppText>
        </View>
        <AnalyticsSourceBadge source={source} />
      </View>
      <View style={styles.chart}>
        {trend.map(point => (
          <View key={point.period} style={styles.column}>
            <View
              style={[
                styles.bar,
                { height: Math.max(12, (point.value / maximum) * 88) },
              ]}
            />
            <AppText style={styles.axisLabel}>
              {formatPeriod(point.period)}
            </AppText>
          </View>
        ))}
      </View>
    </Surface>
  );
}

function formatPeriod(period: string): string {
  const [, month] = period.split('-');
  const monthIndex = Number(month) - 1;
  return Number.isInteger(monthIndex) && monthIndex >= 0 && monthIndex < 12
    ? new Intl.DateTimeFormat('en', { month: 'short' }).format(
        new Date(Date.UTC(2020, monthIndex, 1)),
      )
    : period;
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
