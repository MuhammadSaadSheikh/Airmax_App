import type { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, gradients, radius, spacing, typography } from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';
import { GradientBackground } from '@/components/foundation/GradientBackground';
import { AnimatedPressable } from '@/utils/animations';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonFeedbackState = 'idle' | 'success' | 'error';
export type ButtonBaseProps = PropsWithChildren<{
  title: string;
  onPress?: () => void;
  icon?: AppIconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  feedbackState?: ButtonFeedbackState;
}>;

export function ButtonBase({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = 'primary',
  feedbackState = 'idle',
}: ButtonBaseProps) {
  const isDisabled = disabled || loading;
  const foreground = variant === 'secondary' ? colors.primary : colors.text;
  const body = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {feedbackState !== 'idle' ? (
            <AppIcon
              name={
                feedbackState === 'success'
                  ? 'checkmark-circle'
                  : 'alert-circle'
              }
              size={18}
              color={foreground}
            />
          ) : icon ? (
            <AppIcon name={icon} size={18} color={foreground} />
          ) : null}
          <AppText style={[styles.label, { color: foreground }]}>
            {title}
          </AppText>
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        feedbackState === 'success' && styles.success,
        feedbackState === 'error' && styles.error,
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
    </AnimatedPressable>
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
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.dangerSurface },
  ghost: { backgroundColor: colors.transparent },
});
