import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

export type AdminQuickAction = {
  id: string;
  icon: AppIconName;
  label: string;
  onPress: () => void;
};

export function AdminQuickActions({
  actions,
}: {
  actions: AdminQuickAction[];
}) {
  return (
    <View style={styles.grid}>
      {actions.map(action => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <AppIcon name={action.icon} size={23} color={colors.primary} />
          <AppText style={styles.label}>{action.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: {
    width: '48%',
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  pressed: { opacity: animation.opacity.pressed },
  label: { ...typography.label, color: colors.text, flexShrink: 1 },
});
