import { StyleSheet, View } from 'react-native';
import type { AdminAuditEvent } from '@/services/api/audit.models';
import { spacing } from '@/theme';
import { AuditListItem } from './AuditListItem';

export function AuditTimeline({ events }: { events: AdminAuditEvent[] }) {
  return (
    <View style={styles.timeline}>
      {events.map(event => (
        <AuditListItem key={event.id} event={event} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ timeline: { gap: spacing.md } });
