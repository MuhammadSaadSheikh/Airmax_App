import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export const ui = StyleSheet.create({
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  body: { ...typography.body, color: colors.muted },
  small: { ...typography.small, color: colors.muted },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  label: { ...typography.label, color: colors.textSecondary },
});
