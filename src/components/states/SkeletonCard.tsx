import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { animation, colors, radius, spacing } from '@/theme';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const [opacity] = useState(() => new Animated.Value(0.35));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: animation.duration.slow,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: animation.duration.slow,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[styles.card, { opacity }]}
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
