import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { BillingTimelineEvent } from '@/services/api/billing.models';
import { colors, radius, spacing, typography } from '@/theme';

function eventLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function PaymentTimeline({
  events,
}: {
  events: BillingTimelineEvent[];
}) {
  return (
    <Surface>
      {events.map((event, index) => {
        const last = index === events.length - 1;
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
              <AppText style={styles.type}>{eventLabel(event.type)}</AppText>
              <AppText style={styles.date}>
                {displayDate(event.createdAt)}
              </AppText>
              {event.note ? (
                <AppText style={styles.note}>{event.note}</AppText>
              ) : null}
            </View>
          </View>
        );
      })}
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
  type: {
    ...typography.label,
    color: colors.text,
    textTransform: 'capitalize',
  },
  date: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
