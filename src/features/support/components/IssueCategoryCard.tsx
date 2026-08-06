import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

type IssueCategoryCardProps = {
  icon: AppIconName;
  name: string;
  selected?: boolean;
  onPress: () => void;
};

export function IssueCategoryCard({
  icon,
  name,
  selected,
  onPress,
}: IssueCategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, selected && styles.selectedIcon]}>
        <AppIcon
          name={icon}
          color={selected ? colors.primary : colors.textSecondary}
        />
      </View>
      <AppText style={[styles.name, selected && styles.selectedName]}>
        {name}
      </AppText>
      {selected ? (
        <AppIcon name="checkmark-circle" size={18} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 108,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAccent,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  selectedIcon: { backgroundColor: colors.surfaceStrong },
  name: { ...typography.label, color: colors.textSecondary },
  selectedName: { color: colors.text },
  pressed: { opacity: animation.opacity.pressed },
});
