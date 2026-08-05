import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { AppText } from '@/components/foundation/AppText';

export function LoadingState({
  message = 'Connecting to AIRMAX…',
}: {
  message?: string;
}) {
  return (
    <View accessibilityRole="progressbar" style={styles.state}>
      <ActivityIndicator color={colors.primary} size="large" />
      <AppText style={styles.message}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  message: { ...typography.body, color: colors.muted },
});
