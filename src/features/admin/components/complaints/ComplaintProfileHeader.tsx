import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminComplaint } from '@/services/api/complaints.models';
import { colors, radius, spacing, typography } from '@/theme';
import { ComplaintStatusBadge } from './ComplaintStatusBadge';

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ComplaintProfileHeader({
  complaint,
}: {
  complaint: AdminComplaint;
}) {
  return (
    <Surface style={styles.card}>
      <View style={styles.icon}>
        <AppIcon name="ticket-outline" size={25} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <AppText style={styles.ticket}>
            Ticket #{complaint.ticketNumber}
          </AppText>
          <ComplaintStatusBadge status={complaint.status} />
        </View>
        <AppText style={styles.category}>{complaint.category}</AppText>
        <AppText style={styles.date}>
          Opened {displayDate(complaint.createdAt)}
        </AppText>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ticket: { ...typography.label, color: colors.primary },
  category: { ...typography.sectionTitle, color: colors.text },
  date: { ...typography.small, color: colors.muted },
});
