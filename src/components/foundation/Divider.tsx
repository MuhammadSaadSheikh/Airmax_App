import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, spacing } from '@/theme';

export function Divider({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
