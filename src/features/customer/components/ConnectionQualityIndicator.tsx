import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

interface ConnectionQualityIndicatorProps {
  score: number;
}

function ConnectionQualityIndicatorComponent({
  score,
}: ConnectionQualityIndicatorProps) {
  const progress = useSharedValue(0);
  const normalizedScore = Math.min(100, Math.max(0, score));

  useEffect(() => {
    progress.value = withTiming(normalizedScore / 100, {
      duration: animation.duration.slow,
      easing: Easing.out(Easing.cubic),
    });
  }, [normalizedScore, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`Connection quality ${normalizedScore} percent`}
      style={styles.container}
    >
      <View style={styles.valueRow}>
        <AppText style={styles.label}>QUALITY SCORE</AppText>
        <AppText style={styles.value}>{normalizedScore}%</AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressStyle]} />
      </View>
      <AppText style={styles.caption}>Excellent connection quality</AppText>
    </View>
  );
}

export const ConnectionQualityIndicator = memo(
  ConnectionQualityIndicatorComponent,
);

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.small,
    color: colors.textHero,
    fontFamily: typography.label.fontFamily,
    letterSpacing: spacing.xxs / 2,
  },
  value: {
    ...typography.sectionTitle,
    color: colors.white,
    fontFamily: typography.screenTitle.fontFamily,
  },
  track: {
    height: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.borderOnAccent,
  },
  progress: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    transformOrigin: 'left',
  },
  caption: { ...typography.small, color: colors.textHeroSecondary },
});
