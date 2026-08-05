import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppIcon, AppText, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

interface SpeedMetricCardProps {
  label: string;
  value: number;
  unit: string;
  icon: AppIconName;
  delay?: number;
}

function SpeedMetricCardComponent({
  label,
  value,
  unit,
  icon,
  delay = 0,
}: SpeedMetricCardProps) {
  return (
    <Animated.View
      accessible
      accessibilityLabel={`${label} ${value} ${unit}`}
      entering={FadeIn.delay(delay).duration(animation.duration.normal)}
      style={styles.card}
    >
      <View style={styles.header}>
        <AppText style={styles.label}>{label}</AppText>
        <AppIcon name={icon} color={colors.primary} size={18} />
      </View>
      <View style={styles.valueRow}>
        <AppText style={styles.value}>{value}</AppText>
        <AppText style={styles.unit}>{unit}</AppText>
      </View>
    </Animated.View>
  );
}

export const SpeedMetricCard = memo(SpeedMetricCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { ...typography.small, color: colors.textSecondary },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  value: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: typography.screenTitle.fontSize,
    color: colors.text,
  },
  unit: { ...typography.small, color: colors.muted },
});
