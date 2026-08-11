import { StyleSheet, View } from 'react-native';
import { AppText, StatCard } from '@/components';
import type { AdminPackage } from '@/services/api/packages.models';
import { colors, spacing, typography } from '@/theme';

export function PackageSummaryGrid({ packages }: { packages: AdminPackage[] }) {
  const active = packages.filter(item => item.status === 'active').length;
  const subscribers = packages.reduce(
    (total, item) => total + item.subscriberCount,
    0,
  );
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <StatCard
          icon="cube-outline"
          label="Active packages"
          value={active.toLocaleString('en-PK')}
          color={colors.success}
        />
        <StatCard
          icon="people-outline"
          label="Demo subscribers"
          value={subscribers.toLocaleString('en-PK')}
          color={colors.primary}
        />
      </View>
      <AppText style={styles.note}>
        Summary covers {packages.length} loaded packages; subscriber counts are
        mock data.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', gap: spacing.md },
  note: { ...typography.small, color: colors.muted },
});
