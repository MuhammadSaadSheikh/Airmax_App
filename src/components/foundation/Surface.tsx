import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export function Surface({ style, ...props }: PropsWithChildren<ViewProps>) {
  return <View {...props} style={[styles.surface, style]} />;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
});
