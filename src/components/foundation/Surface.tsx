import type { PropsWithChildren } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import {
  animation,
  colors,
  gradients,
  radius,
  shadows,
  spacing,
} from '@/theme';
import { GradientBackground } from './GradientBackground';

type SurfaceProps = PropsWithChildren<ViewProps> & {
  loading?: boolean;
  disabled?: boolean;
};

export function Surface({
  style,
  loading = false,
  disabled = false,
  ...props
}: SurfaceProps) {
  return (
    <GradientBackground
      {...props}
      colors={[...gradients.premiumSurface]}
      accessibilityState={{ disabled, busy: loading }}
      style={[styles.surface, (loading || disabled) && styles.disabled, style]}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  disabled: { opacity: animation.opacity.disabled },
});
