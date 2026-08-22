import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminPackage } from '@/services/api/packages.models';
import { animation, colors, money, spacing, typography } from '@/theme';
import { PackageStatusBadge } from './PackageStatusBadge';

export function PackageListItem({
  packageItem,
  onPress,
}: {
  packageItem: AdminPackage;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${packageItem.name}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <AppText numberOfLines={1} style={styles.name}>
              {packageItem.name}
            </AppText>
            <AppText style={styles.speed}>{packageItem.speedMbps} Mbps</AppText>
          </View>
          <PackageStatusBadge status={packageItem.status} />
        </View>
        <View style={styles.metrics}>
          <AppText style={styles.price}>{money(packageItem.price)}</AppText>
          <AppText style={styles.meta}>
            {packageItem.durationDays} days · {packageItem.features.length}{' '}
            features · {packageItem.subscriberCount} subscribers
          </AppText>
        </View>
        <View style={styles.footer}>
          <AppText numberOfLines={1} style={styles.features}>
            {packageItem.features.join(' · ')}
          </AppText>
          <AppIcon name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: animation.opacity.pressed },
  card: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  name: { ...typography.sectionTitle, color: colors.text },
  speed: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
  metrics: { gap: spacing.xs },
  price: { ...typography.bodyLarge, color: colors.text },
  meta: { ...typography.small, color: colors.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  features: { flex: 1, ...typography.small, color: colors.muted },
});
