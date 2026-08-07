import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { AppIcon, AppText, StatusBadge, Surface } from '@/components';
import type { Complaint, ComplaintStatus } from '@/services/support';
import { colors, radius, spacing, typography } from '@/theme';
import { AnimatedPressable, pulse as pulseAnimation } from '@/utils/animations';

const statusTone = (status: ComplaintStatus) =>
  status === 'resolved'
    ? 'success'
    : status === 'submitted'
      ? 'warning'
      : 'info';

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

function ComplaintCardView({
  complaint,
  onPress,
}: {
  complaint: Complaint;
  onPress: () => void;
}) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (complaint.status !== 'resolved') {
      pulse.value = pulseAnimation(0.35);
    }
  }, [complaint.status, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${complaint.id}, ${complaint.title}, ${complaint.status.replaceAll('_', ' ')}`}
      onPress={onPress}
    >
      <Surface style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.ticketRow}>
            {complaint.status !== 'resolved' ? (
              <Animated.View style={[styles.pulse, pulseStyle]} />
            ) : null}
            <AppText style={styles.ticket}>{complaint.id}</AppText>
          </View>
          <StatusBadge
            label={complaint.status}
            tone={statusTone(complaint.status)}
          />
        </View>
        <AppText style={styles.title} numberOfLines={2}>
          {complaint.title}
        </AppText>
        <View style={styles.meta}>
          <AppIcon name="calendar-outline" size={15} color={colors.muted} />
          <AppText style={styles.metaText}>
            {dateLabel(complaint.createdAt)}
          </AppText>
        </View>
        <View style={styles.resolution}>
          <AppText style={styles.resolutionLabel}>EXPECTED RESOLUTION</AppText>
          <AppText style={styles.resolutionValue}>
            {complaint.expectedResolution ?? 'Update pending'}
          </AppText>
        </View>
      </Surface>
    </AnimatedPressable>
  );
}

export const ComplaintCard = memo(ComplaintCardView);

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  ticket: { ...typography.label, color: colors.primary },
  title: { ...typography.sectionTitle, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.small, color: colors.muted },
  resolution: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resolutionLabel: { ...typography.small, color: colors.muted },
  resolutionValue: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
