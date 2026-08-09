import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';

export function MockActionNotice() {
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <AppIcon name="flask-outline" size={19} color={colors.warning} />
      <AppText style={styles.copy}>
        Mock operation. Changes reset when the application reloads.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.warning}55`,
    borderRadius: radius.md,
    backgroundColor: `${colors.warning}1A`,
    padding: spacing.md,
  },
  copy: { flex: 1, ...typography.small, color: colors.textSecondary },
});
