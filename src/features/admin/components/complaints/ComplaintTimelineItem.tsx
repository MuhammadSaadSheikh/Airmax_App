import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import type { AdminComplaintEvent } from '@/services/api/complaints.models';
import { colors, radius, spacing, typography } from '@/theme';
import { ComplaintStatusBadge } from './ComplaintStatusBadge';

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ComplaintTimelineItem({
  event,
  last,
}: {
  event: AdminComplaintEvent;
  last: boolean;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.markerColumn}>
        <View style={styles.marker}>
          <AppIcon name="checkmark" size={13} color={colors.textOnAccent} />
        </View>
        {!last ? <View style={styles.line} /> : null}
      </View>
      <View style={[styles.content, !last && styles.contentSpacing]}>
        <ComplaintStatusBadge status={event.status} />
        <AppText style={styles.date}>{displayDate(event.createdAt)}</AppText>
        {event.note ? (
          <AppText style={styles.note}>{event.note}</AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.md },
  markerColumn: { width: 24, alignItems: 'center' },
  marker: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  content: { flex: 1, minHeight: 24 },
  contentSpacing: { paddingBottom: spacing.lg },
  date: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
