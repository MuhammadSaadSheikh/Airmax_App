import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type { AdminAuditEvent } from '@/services/api/audit.models';
import { colors, spacing, typography } from '@/theme';
import { AuditActionBadge } from './AuditActionBadge';
import { AuditEntityBadge } from './AuditEntityBadge';

function displayDate(timestamp: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function AuditListItem({ event }: { event: AdminAuditEvent }) {
  const metadata = Object.entries(event.metadata);
  return (
    <Surface
      accessibilityLabel={`${event.actorName}, ${event.action}, ${event.entityType} ${event.entityId}`}
    >
      <View style={styles.header}>
        <View style={styles.actor}>
          <AppText style={styles.name}>{event.actorName}</AppText>
          <AppText style={styles.actorId}>{event.actorId}</AppText>
        </View>
        <AppText style={styles.time}>{displayDate(event.timestamp)}</AppText>
      </View>
      <View style={styles.badges}>
        <AuditActionBadge action={event.action} />
        <AuditEntityBadge entityType={event.entityType} />
      </View>
      <AppText style={styles.entity}>Entity ID: {event.entityId}</AppText>
      {metadata.length > 0 ? (
        <View style={styles.metadata}>
          {metadata.map(([key, value]) => (
            <View key={key} style={styles.metadataRow}>
              <AppText style={styles.metadataKey}>
                {key.replaceAll('_', ' ')}
              </AppText>
              <AppText style={styles.metadataValue}>{String(value)}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actor: { flex: 1 },
  name: { ...typography.label, color: colors.text },
  actorId: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  time: { ...typography.small, color: colors.muted, textAlign: 'right' },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  entity: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  metadata: { marginTop: spacing.md, gap: spacing.xs },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metadataKey: { ...typography.small, color: colors.muted },
  metadataValue: {
    ...typography.small,
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
  },
});
