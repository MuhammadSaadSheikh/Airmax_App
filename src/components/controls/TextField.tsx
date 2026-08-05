import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: AppIconName;
};

export function TextField({
  label,
  error,
  icon,
  style,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      {label ? <AppText style={styles.label}>{label}</AppText> : null}
      <View
        style={[
          styles.wrapper,
          props.multiline && styles.multilineWrapper,
          error && styles.invalid,
        ]}
      >
        {icon ? <AppIcon name={icon} size={19} color={colors.muted} /> : null}
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            props.multiline && styles.multilineInput,
            style,
          ]}
        />
      </View>
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm - 1, marginBottom: spacing.lg - 1 },
  label: { ...typography.label, color: colors.textSecondary },
  wrapper: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg - 1,
    gap: spacing.sm + spacing.xxs,
  },
  multilineWrapper: {
    height: undefined,
    minHeight: 112,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  input: { flex: 1, color: colors.text, ...typography.bodyLarge },
  multilineInput: { minHeight: 86, textAlignVertical: 'top' },
  invalid: { borderColor: colors.danger },
  error: { ...typography.small, color: colors.danger },
});
