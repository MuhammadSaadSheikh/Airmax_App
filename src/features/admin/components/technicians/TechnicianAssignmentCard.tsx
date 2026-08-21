import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminTechnician } from '@/services/api/technicians.models';
import { animation, colors, radius, spacing, typography } from '@/theme';
import { TechnicianStatusBadge } from './TechnicianStatusBadge';

export function TechnicianAssignmentCard({
  technician,
  selected,
  disabled,
  onPress,
}: {
  technician: AdminTechnician;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Select ${technician.name}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface
        disabled={disabled}
        style={[styles.card, selected && styles.selected]}
      >
        <View style={styles.header}>
          <View style={styles.copy}>
            <AppText style={styles.name}>{technician.name}</AppText>
            <AppText style={styles.area}>{technician.area.name}</AppText>
          </View>
          <TechnicianStatusBadge status={technician.status} />
          <AppIcon
            name={selected ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={selected ? colors.primary : colors.muted}
          />
        </View>
        <AppText style={styles.skills}>
          {technician.skills.map(item => item.name).join(' · ')}
        </AppText>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: animation.opacity.pressed },
  card: { borderRadius: radius.xl },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1 },
  name: { ...typography.sectionTitle, color: colors.text },
  area: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  skills: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
