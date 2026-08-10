import { StyleSheet, View } from 'react-native';
import { AppText, StatCard } from '@/components';
import type { AdminComplaint } from '@/services/api/complaints.models';
import { colors, spacing, typography } from '@/theme';

export function ComplaintSummaryGrid({
  complaints,
}: {
  complaints: AdminComplaint[];
}) {
  const open = complaints.filter(
    complaint =>
      complaint.status !== 'resolved' && complaint.status !== 'closed',
  ).length;
  const resolved = complaints.filter(
    complaint => complaint.status === 'resolved',
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <StatCard
          icon="alert-circle-outline"
          label="Open loaded"
          value={open.toLocaleString('en-PK')}
          color={colors.warning}
        />
        <StatCard
          icon="checkmark-done-outline"
          label="Resolved loaded"
          value={resolved.toLocaleString('en-PK')}
          color={colors.success}
        />
      </View>
      <AppText style={styles.note}>
        Summary is limited to {complaints.length.toLocaleString('en-PK')} loaded
        records.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', gap: spacing.md },
  note: { ...typography.small, color: colors.muted },
});
