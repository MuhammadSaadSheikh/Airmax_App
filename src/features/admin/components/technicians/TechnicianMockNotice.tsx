import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';

export function TechnicianMockNotice() {
  return (
    <View accessibilityRole="text" style={styles.notice}>
      <AppIcon name="flask-outline" size={18} color={colors.primary} />
      <AppText style={styles.text}>
        Field service actions use deterministic mock data in this build.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  text: { flex: 1, ...typography.small, color: colors.textSecondary },
});
