import { StyleSheet, View } from 'react-native';
import { StatCard } from '@/components';
import type { AdminTechnician } from '@/services/api/technicians.models';
import { colors, spacing } from '@/theme';

export function TechnicianSummaryGrid({
  technicians,
}: {
  technicians: AdminTechnician[];
}) {
  const available = technicians.filter(
    item => item.status === 'AVAILABLE',
  ).length;
  const activeJobs = technicians.reduce(
    (total, item) => total + item.workload.activeJobs,
    0,
  );
  return (
    <View style={styles.grid}>
      <StatCard
        icon="checkmark-circle-outline"
        label="Available"
        value={available.toString()}
        color={colors.success}
      />
      <StatCard
        icon="briefcase-outline"
        label="Active jobs"
        value={activeJobs.toString()}
        color={colors.warning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
});
