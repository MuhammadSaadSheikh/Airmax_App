import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

function TestingAnimationComponent({ label }: { label: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(animation.opacity.disabled, { duration: animation.duration.slow }),
      -1,
      true,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View accessibilityLiveRegion="polite" style={styles.row}>
      <Animated.View style={[styles.dot, animatedStyle]} />
      <AppText style={styles.label}>{label}</AppText>
    </View>
  );
}

export const TestingAnimation = memo(TestingAnimationComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.primary },
  label: { ...typography.label, color: colors.textSecondary },
});
