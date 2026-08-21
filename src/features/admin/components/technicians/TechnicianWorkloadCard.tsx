import { StyleSheet, View } from 'react-native';
import { AppText, Row, Surface } from '@/components';
import type { TechnicianWorkload } from '@/services/api/technicians.models';
import { colors, spacing, typography } from '@/theme';

export function TechnicianWorkloadCard({
  workload,
}: {
  workload: TechnicianWorkload;
}) {
  return (
    <Surface>
      <View style={styles.summary}>
        <View style={styles.metric}>
          <AppText style={styles.value}>{workload.activeJobs}</AppText>
          <AppText style={styles.label}>Active</AppText>
        </View>
        <View style={styles.metric}>
          <AppText style={styles.value}>{workload.completedJobs}</AppText>
          <AppText style={styles.label}>Completed</AppText>
        </View>
      </View>
      {workload.assignments.length === 0 ? (
        <AppText style={styles.empty}>No work orders recorded.</AppText>
      ) : (
        workload.assignments.map(item => (
          <View key={item.id} style={styles.order}>
            <Row
              icon="briefcase-outline"
              title={item.workOrder.id}
              subtitle={`${item.complaintId} · ${item.workOrder.status.replaceAll('_', ' ')}`}
            />
          </View>
        ))
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: spacing.xxl, marginBottom: spacing.md },
  metric: { flex: 1 },
  value: { ...typography.sectionTitle, color: colors.primary },
  label: { ...typography.small, color: colors.muted },
  order: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  empty: { ...typography.body, color: colors.textSecondary },
});
