import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminPackage } from '@/services/api/packages.models';
import { colors, radius, spacing, typography } from '@/theme';
import { PackageStatusBadge } from './PackageStatusBadge';

export function PackageProfileHeader({
  packageItem,
}: {
  packageItem: AdminPackage;
}) {
  return (
    <Surface style={styles.card}>
      <View style={styles.icon}>
        <AppIcon name="speedometer-outline" size={27} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <AppText style={styles.name}>{packageItem.name}</AppText>
          <PackageStatusBadge status={packageItem.status} />
        </View>
        <AppText style={styles.description}>
          {packageItem.description ?? 'No package description provided.'}
        </AppText>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, ...typography.sectionTitle, color: colors.text },
  description: { ...typography.body, color: colors.textSecondary },
});
