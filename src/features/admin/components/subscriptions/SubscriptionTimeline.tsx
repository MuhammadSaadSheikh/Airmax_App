import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { SubscriptionHistory } from '@/services/api/subscriptions.models';
import { colors, radius, spacing, typography } from '@/theme';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

export function SubscriptionTimeline({
  history,
}: {
  history: SubscriptionHistory[];
}) {
  return (
    <Surface>
      {history.length === 0 ? (
        <AppText style={styles.empty}>
          No subscription activity recorded.
        </AppText>
      ) : (
        history.map((event, index) => {
          const last = index === history.length - 1;
          return (
            <View key={event.id} style={styles.item}>
              <View style={styles.markerColumn}>
                <View style={styles.marker}>
                  <AppIcon
                    name="checkmark"
                    size={13}
                    color={colors.textOnAccent}
                  />
                </View>
                {!last ? <View style={styles.line} /> : null}
              </View>
              <View style={[styles.content, !last && styles.contentSpacing]}>
                <SubscriptionStatusBadge status={event.status} />
                <AppText style={styles.package}>{event.packageName}</AppText>
                <AppText style={styles.date}>
                  {displayDate(event.createdAt)}
                </AppText>
                {event.note ? (
                  <AppText style={styles.note}>{event.note}</AppText>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </Surface>
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
  package: { ...typography.label, color: colors.text, marginTop: spacing.sm },
  date: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  empty: { ...typography.body, color: colors.textSecondary },
});
