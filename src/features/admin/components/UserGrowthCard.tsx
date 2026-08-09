import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { DashboardAnalytics } from '@/services/api/reports.service';
import { colors, radius, spacing, typography } from '@/theme';

type UserGrowth = DashboardAnalytics['userGrowth'];

export function UserGrowthCard({ growth }: { growth: UserGrowth }) {
  const maximum = Math.max(...growth.trend.map(point => point.value), 1);

  return (
    <Surface style={styles.card}>
      <View style={styles.icon}>
        <AppIcon name="trending-up-outline" color={colors.success} size={22} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>User growth</AppText>
        <AppText style={styles.value}>
          +{growth.newUsers.toLocaleString('en-PK')}
        </AppText>
        <AppText style={styles.change}>
          ↑ {growth.percentageChange.toFixed(1)}% this month
        </AppText>
        <View style={styles.sparkline}>
          {growth.trend.map(point => (
            <View
              key={point.label}
              accessibilityLabel={`${point.label}: ${point.value} new users`}
              style={[
                styles.spark,
                { height: Math.max(5, (point.value / maximum) * 30) },
              ]}
            />
          ))}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: `${colors.success}1A`,
  },
  copy: { flex: 1 },
  title: { ...typography.label, color: colors.textSecondary },
  value: {
    ...typography.screenTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  change: { ...typography.small, color: colors.success },
  sparkline: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  spark: {
    flex: 1,
    borderRadius: radius.xs,
    backgroundColor: colors.success,
  },
});
