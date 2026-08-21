import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminTechnician } from '@/services/api/technicians.models';
import { animation, colors, spacing, typography } from '@/theme';
import { TechnicianStatusBadge } from './TechnicianStatusBadge';

export function TechnicianListItem({
  technician,
  onPress,
}: {
  technician: AdminTechnician;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open technician ${technician.name}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <AppIcon
              name="construct-outline"
              size={22}
              color={colors.primary}
            />
            <AppText numberOfLines={1} style={styles.name}>
              {technician.name}
            </AppText>
          </View>
          <TechnicianStatusBadge status={technician.status} />
        </View>
        <View style={styles.metaRow}>
          <AppIcon name="location-outline" size={16} color={colors.muted} />
          <AppText style={styles.meta}>{technician.area.name}</AppText>
        </View>
        <View style={styles.jobs}>
          <AppText style={styles.jobValue}>
            {technician.workload.activeJobs}
          </AppText>
          <AppText style={styles.jobLabel}>Active jobs</AppText>
          <View style={styles.divider} />
          <AppText style={styles.jobValue}>
            {technician.workload.completedJobs}
          </AppText>
          <AppText style={styles.jobLabel}>Completed jobs</AppText>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: animation.opacity.pressed },
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: { flex: 1, ...typography.sectionTitle, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { ...typography.body, color: colors.textSecondary },
  jobs: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  jobValue: { ...typography.label, color: colors.primary },
  jobLabel: { ...typography.small, color: colors.muted },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
});
