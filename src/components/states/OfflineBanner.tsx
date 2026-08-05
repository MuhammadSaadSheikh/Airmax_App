import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { AppIcon } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';

export function OfflineBanner({
  visible,
  onRetry,
}: {
  visible: boolean;
  onRetry?: () => void;
}) {
  if (!visible) return null;
  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <AppIcon name="cloud-offline-outline" size={18} color={colors.warning} />
      <AppText style={styles.message}>
        You’re offline. Some information may be out of date.
      </AppText>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <AppText style={styles.retry}>Retry</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: `${colors.warning}18`,
    borderWidth: 1,
    borderColor: `${colors.warning}55`,
  },
  message: { flex: 1, ...typography.small, color: colors.textSecondary },
  retry: { ...typography.label, color: colors.warning },
});
