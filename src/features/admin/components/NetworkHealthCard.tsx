import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type {
  AnalyticsDataSource,
  DashboardAnalytics,
} from '@/services/api/reports.models';
import { colors, radius, spacing, typography } from '@/theme';
import { AnalyticsSourceBadge } from './AnalyticsSourceBadge';

type NetworkHealth = DashboardAnalytics['networkHealth'];

export function NetworkHealthCard({
  health,
  source,
}: {
  health: NetworkHealth;
  source: AnalyticsDataSource;
}) {
  const percentage = Math.min(100, Math.max(0, health.availabilityPercentage));
  const width = `${percentage}%` as ViewStyle['width'];

  return (
    <Surface>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.icon}>
            <AppIcon name="pulse-outline" color={colors.success} size={22} />
          </View>
          <View>
            <AppText style={styles.title}>Network health</AppText>
            <AppText style={styles.subtitle}>Current user availability</AppText>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <AnalyticsSourceBadge source={source} />
          <AppText style={styles.percentage}>{percentage.toFixed(1)}%</AppText>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width }]} />
      </View>
      <View style={styles.counts}>
        <HealthCount
          label="Online"
          value={health.onlineUsers}
          color={colors.success}
        />
        <HealthCount
          label="Offline"
          value={health.offlineUsers}
          color={colors.danger}
        />
      </View>
    </Surface>
  );
}

function HealthCount({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.count}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText style={styles.countLabel}>{label}</AppText>
      <AppText style={styles.countValue}>
        {value.toLocaleString('en-PK')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: `${colors.success}1A`,
  },
  title: { ...typography.sectionTitle, color: colors.text },
  subtitle: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  percentage: {
    ...typography.sectionTitle,
    color: colors.success,
  },
  headerMeta: { alignItems: 'flex-end', gap: spacing.sm },
  track: {
    height: spacing.sm + spacing.xxs,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    marginTop: spacing.xl,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  counts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  count: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  countLabel: { ...typography.small, color: colors.muted },
  countValue: { ...typography.label, color: colors.text },
});
