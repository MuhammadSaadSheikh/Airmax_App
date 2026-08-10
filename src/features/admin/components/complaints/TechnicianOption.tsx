import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import type { AdminTechnicianOption } from '@/services/api/complaints.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

export function TechnicianOption({
  technician,
  selected,
  disabled,
  onPress,
}: {
  technician: AdminTechnicianOption;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <View style={styles.copy}>
        <AppText style={styles.name}>{technician.name}</AppText>
        <AppText style={styles.meta}>
          {technician.areaName ?? 'Area unassigned'} ·{' '}
          {technician.status.replaceAll('_', ' ')}
        </AppText>
        <AppText style={styles.workload}>
          {technician.complaintCount} assigned complaints
        </AppText>
      </View>
      <AppIcon
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? colors.primary : colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceInteractive,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  dimmed: { opacity: animation.opacity.disabled },
  copy: { flex: 1 },
  name: { ...typography.bodyLarge, color: colors.text },
  meta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  workload: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
});
