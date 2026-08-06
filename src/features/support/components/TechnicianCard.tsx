import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, StatusBadge, Surface } from '@/components';
import type { TechnicianAssignment } from '@/services/support';
import { colors, radius, spacing, typography } from '@/theme';

export function TechnicianCard({
  assignment,
}: {
  assignment: TechnicianAssignment;
}) {
  return (
    <Surface
      style={styles.card}
      accessibilityLabel={`Technician ${assignment.technicianName}, ${assignment.status.replaceAll('_', ' ')}`}
    >
      <View style={styles.avatar}>
        <AppIcon name="construct" size={25} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.label}>ASSIGNED TECHNICIAN</AppText>
        <AppText style={styles.name}>{assignment.technicianName}</AppText>
        <AppText style={styles.detail}>
          Assigned {assignment.assignedAt}
        </AppText>
        <View style={styles.etaRow}>
          <AppIcon name="time-outline" size={15} color={colors.warning} />
          <AppText style={styles.eta}>{assignment.eta}</AppText>
        </View>
      </View>
      <StatusBadge
        label={assignment.status}
        tone={assignment.status === 'completed' ? 'success' : 'info'}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { ...typography.small, color: colors.muted },
  name: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  detail: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  eta: { ...typography.small, color: colors.warning },
});
