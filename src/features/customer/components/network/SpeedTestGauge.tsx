import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components';
import type { SpeedTestState } from '@/services/network';
import { animation, colors, radius, spacing, typography } from '@/theme';

interface SpeedTestGaugeProps {
  state: SpeedTestState;
  value: number;
}

function SpeedTestGaugeComponent({ state, value }: SpeedTestGaugeProps) {
  const rotation = useSharedValue(-120);

  useEffect(() => {
    if (state === 'testing') {
      rotation.value = withRepeat(
        withTiming(120, {
          duration: animation.duration.splash,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      );
    } else {
      const target = -120 + Math.min(value, 150) * 1.6;
      rotation.value = withTiming(target, { duration: animation.duration.slow });
    }
  }, [rotation, state, value]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`Speed gauge ${state}, ${value} megabits per second`}
      style={styles.gauge}
    >
      <View style={styles.ring} />
      <Animated.View style={[styles.needle, needleStyle]}>
        <View style={styles.needleLine} />
      </Animated.View>
      <View style={styles.center} />
      <View style={styles.copy}>
        <AppText style={styles.value}>{Math.round(value)}</AppText>
        <AppText style={styles.unit}>Mbps</AppText>
      </View>
    </View>
  );
}

export const SpeedTestGauge = memo(SpeedTestGaugeComponent);

const gaugeSize = spacing.huge * 6;
const styles = StyleSheet.create({
  gauge: {
    width: gaugeSize,
    height: gaugeSize,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: spacing.none,
    right: spacing.none,
    bottom: spacing.none,
    left: spacing.none,
    borderRadius: radius.pill,
    borderWidth: spacing.sm,
    borderColor: colors.border,
    borderTopColor: colors.primary,
    borderRightColor: colors.electric,
  },
  needle: {
    position: 'absolute',
    width: gaugeSize,
    height: gaugeSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleLine: {
    width: spacing.xs,
    height: gaugeSize / 2 - spacing.xxl,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    transform: [{ translateY: -(gaugeSize / 4 - spacing.md) }],
  },
  center: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  copy: { position: 'absolute', bottom: spacing.xxl, alignItems: 'center' },
  value: { ...typography.screenTitle, color: colors.text },
  unit: { ...typography.small, color: colors.muted },
});
