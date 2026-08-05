import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon, AppText, Surface } from '@/components';
import type { UsageStats } from '@/services/network';
import { animation, colors, radius, spacing, typography } from '@/theme';

function UsageSummaryCardComponent({ usage }: { usage: UsageStats }) {
  const progress = useSharedValue(0);
  const percentage = Math.min(100, Math.max(0, usage.percentage));

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: animation.duration.slow,
    });
  }, [percentage, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <Surface
      accessible
      accessibilityLabel={`${usage.monthlyUsage} gigabytes of ${usage.limit} gigabytes used this month`}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppIcon name="analytics-outline" color={colors.primary} size={20} />
          <AppText style={styles.title}>Monthly usage</AppText>
        </View>
        <AppText style={styles.percentage}>{Math.round(percentage)}%</AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressStyle]} />
      </View>
      <View style={styles.footer}>
        <AppText style={styles.used}>{usage.monthlyUsage} GB used</AppText>
        <AppText style={styles.limit}>{usage.limit} GB allowance</AppText>
      </View>
    </Surface>
  );
}

export const UsageSummaryCard = memo(UsageSummaryCardComponent);

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.label, color: colors.text },
  percentage: { ...typography.label, color: colors.primary },
  track: {
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  progress: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    transformOrigin: 'left',
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  used: { ...typography.small, color: colors.textSecondary },
  limit: { ...typography.small, color: colors.muted },
});
