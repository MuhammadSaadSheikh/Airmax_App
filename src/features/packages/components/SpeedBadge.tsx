import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';

function SpeedBadgeComponent({ speed }: { speed: number }) {
  return (
    <View accessible accessibilityLabel={`${speed} megabits per second`} style={styles.badge}>
      <AppText style={styles.value}>{speed}</AppText>
      <AppText style={styles.unit}>Mbps</AppText>
    </View>
  );
}

export const SpeedBadge = memo(SpeedBadgeComponent);

const styles = StyleSheet.create({
  badge: { alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceAccent },
  value: { ...typography.screenTitle, color: colors.primary },
  unit: { ...typography.small, color: colors.muted },
});
