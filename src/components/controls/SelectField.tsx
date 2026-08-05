import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';

type SelectFieldProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  icon?: AppIconName;
  disabled?: boolean;
  onPress?: () => void;
};

export function SelectField({
  label,
  value,
  placeholder,
  icon,
  disabled,
  onPress,
}: SelectFieldProps) {
  return (
    <View style={styles.field}>
      {label ? <AppText style={styles.label}>{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.control,
          (pressed || disabled) && styles.dimmed,
        ]}
      >
        {icon ? <AppIcon name={icon} size={19} color={colors.muted} /> : null}
        <AppText style={[styles.value, !value && styles.placeholder]}>
          {value ?? placeholder}
        </AppText>
        <AppIcon name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm - 1, marginBottom: spacing.lg - 1 },
  label: { ...typography.label, color: colors.textSecondary },
  control: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg - 1,
    gap: spacing.sm + spacing.xxs,
  },
  value: { flex: 1, ...typography.bodyLarge, color: colors.text },
  placeholder: { color: colors.placeholder },
  dimmed: { opacity: 0.6 },
});
