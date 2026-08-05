import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import {
  animation,
  colors,
  gradients,
  radius,
  spacing,
  typography,
} from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';
import { GradientBackground } from '@/components/foundation/GradientBackground';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonBaseProps = PropsWithChildren<{
  title: string;
  onPress?: () => void;
  icon?: AppIconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
}>;

export function ButtonBase({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = 'primary',
}: ButtonBaseProps) {
  const isDisabled = disabled || loading;
  const foreground = variant === 'secondary' ? colors.primary : colors.text;
  const body = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <AppIcon name={icon} size={18} color={foreground} /> : null}
          <AppText style={[styles.label, { color: foreground }]}>
            {title}
          </AppText>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        (pressed || isDisabled) && {
          opacity: isDisabled
            ? animation.opacity.disabled
            : animation.opacity.pressed,
        },
      ]}
    >
      {variant === 'primary' ? (
        <GradientBackground
          colors={[...gradients.primary]}
          style={styles.gradient}
        >
          {body}
        </GradientBackground>
      ) : (
        body
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    marginTop: spacing.sm + spacing.xxs,
  },
  gradient: { minHeight: 52, justifyContent: 'center' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg + spacing.xxs,
  },
  label: { ...typography.button },
  secondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceInteractive,
  },
  danger: { backgroundColor: colors.dangerSurface },
  ghost: { backgroundColor: colors.transparent },
});
