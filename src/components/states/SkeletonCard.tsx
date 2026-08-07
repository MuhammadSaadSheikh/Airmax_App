import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme';
import { pulse } from '@/utils/animations';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = pulse(0.35);
    return () => {
      opacity.value = 0.35;
    };
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.title} />
      {Array.from({ length: lines }, (_, index) => (
        <View
          key={index}
          style={[styles.line, index === lines - 1 && styles.short]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    height: 20,
    width: '52%',
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
  },
  line: {
    height: 12,
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
  },
  short: { width: '68%' },
});
