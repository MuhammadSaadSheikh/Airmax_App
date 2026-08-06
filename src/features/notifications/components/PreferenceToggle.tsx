import { StyleSheet, Switch, View } from 'react-native';
import { AppIcon, AppText, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

type Props = {
  icon: AppIconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function PreferenceToggle({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled,
}: Props) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.icon}>
        <AppIcon name={icon} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.description}>{description}</AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={description}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface2, true: colors.borderStrong }}
        thumbColor={value ? colors.primary : colors.muted}
        ios_backgroundColor={colors.surface2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAccent,
  },
  copy: { flex: 1 },
  title: { ...typography.label, color: colors.text },
  description: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  disabled: { opacity: animation.opacity.disabled },
});
