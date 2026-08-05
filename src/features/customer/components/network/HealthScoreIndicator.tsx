import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

function HealthScoreIndicatorComponent({ score }: { score: number }) {
  const progress = useSharedValue(0);
  const safeScore = Math.min(100, Math.max(0, score));

  useEffect(() => {
    progress.value = withTiming(safeScore / 100, {
      duration: animation.duration.slow,
    });
  }, [progress, safeScore]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View accessible accessibilityLabel={`Health score ${safeScore} percent`}>
      <View style={styles.copy}>
        <AppText style={styles.label}>HEALTH SCORE</AppText>
        <AppText style={styles.score}>{safeScore}%</AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressStyle]} />
      </View>
    </View>
  );
}

export const HealthScoreIndicator = memo(HealthScoreIndicatorComponent);

const styles = StyleSheet.create({
  copy: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: { ...typography.small, color: colors.muted },
  score: { ...typography.sectionTitle, color: colors.success },
  track: {
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    transformOrigin: 'left',
  },
});
