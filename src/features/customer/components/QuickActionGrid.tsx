import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

export interface QuickAction {
  id: string;
  label: string;
  icon: AppIconName;
  onPress: () => void;
}

function QuickActionGridComponent({ actions }: { actions: QuickAction[] }) {
  return (
    <View accessibilityRole="toolbar" style={styles.grid}>
      {actions.map(action => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <View style={styles.icon}>
            <AppIcon name={action.icon} color={colors.primary} size={23} />
          </View>
          <AppText numberOfLines={2} style={styles.label}>
            {action.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export const QuickActionGrid = memo(QuickActionGridComponent);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: {
    width: '31.5%',
    minHeight: spacing.huge * 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: animation.opacity.pressed,
    backgroundColor: colors.surfaceInteractive,
  },
  icon: {
    width: spacing.huge + spacing.md,
    height: spacing.huge + spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
