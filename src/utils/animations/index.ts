import {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  ZoomIn,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { animation, spacing } from '@/theme';

/** Shared, system-reduced-motion-aware layout animation presets. */
export const fadeIn = (delay = 0) =>
  FadeIn.delay(delay)
    .duration(animation.duration.normal)
    .reduceMotion(ReduceMotion.System);

export const fadeOut = () =>
  FadeOut.duration(animation.duration.fast).reduceMotion(ReduceMotion.System);

export const slideUp = (delay = 0) =>
  SlideInDown.delay(delay)
    .springify()
    .damping(animation.spring.gentle.damping)
    .stiffness(animation.spring.gentle.stiffness)
    .reduceMotion(ReduceMotion.System);

export const scaleIn = (delay = 0) =>
  ZoomIn.delay(delay)
    .duration(animation.duration.normal)
    .reduceMotion(ReduceMotion.System);

/** Worklet helpers for animated styles. */
export const pulse = (from = 0.45) =>
  withRepeat(
    withSequence(
      withTiming(from, { duration: 0 }),
      withTiming(1, {
        duration: animation.duration.slow,
        easing: Easing.inOut(Easing.ease),
        reduceMotion: ReduceMotion.System,
      }),
    ),
    -1,
    true,
  );

export const shimmer = (distance: number) =>
  withRepeat(
    withSequence(
      withTiming(distance, {
        duration: animation.duration.slow * 2,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      withTiming(-distance, { duration: 0 }),
    ),
    -1,
  );

export const shake = () =>
  withSequence(
    withTiming(-spacing.sm, { duration: animation.duration.instant }),
    withRepeat(
      withTiming(spacing.sm, { duration: animation.duration.instant }),
      3,
      true,
    ),
    withTiming(spacing.none, { duration: animation.duration.instant }),
  );

export * from './AnimatedPressable';
