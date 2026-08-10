import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminComplaint } from '@/services/api/complaints.models';
import { animation, colors, spacing, typography } from '@/theme';
import { ComplaintStatusBadge } from './ComplaintStatusBadge';

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function ComplaintListItem({
  complaint,
  onPress,
}: {
  complaint: AdminComplaint;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ticket ${complaint.ticketNumber}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={styles.header}>
          <AppText style={styles.ticket}>#{complaint.ticketNumber}</AppText>
          <ComplaintStatusBadge status={complaint.status} />
        </View>
        <AppText numberOfLines={1} style={styles.category}>
          {complaint.category}
        </AppText>
        <AppText numberOfLines={2} style={styles.description}>
          {complaint.description}
        </AppText>
        <View style={styles.footer}>
          <View style={styles.customer}>
            <AppIcon name="person-outline" size={16} color={colors.muted} />
            <AppText numberOfLines={1} style={styles.meta}>
              {complaint.customer.name} ·{' '}
              {complaint.customer.connectionId ?? 'Connection pending'}
            </AppText>
          </View>
          <AppText style={styles.date}>
            {displayDate(complaint.createdAt)}
          </AppText>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: animation.opacity.pressed },
  card: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ticket: { ...typography.label, color: colors.primary },
  category: { ...typography.sectionTitle, color: colors.text },
  description: { ...typography.body, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: { flex: 1, ...typography.small, color: colors.muted },
  date: { ...typography.small, color: colors.muted },
});
