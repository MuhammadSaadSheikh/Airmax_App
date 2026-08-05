import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import { colors, spacing, typography } from '@/theme';

function ConnectionTimelineComponent({ connectedSince, lastChecked }: { connectedSince: string; lastChecked: string }) {
  return (
    <Surface style={styles.surface}>
      <TimelineItem icon="time-outline" label="Connected since" value={connectedSince} />
      <View style={styles.line} />
      <TimelineItem icon="checkmark-circle-outline" label="Last checked" value={lastChecked} />
    </Surface>
  );
}

function TimelineItem({ icon, label, value }: { icon: 'time-outline' | 'checkmark-circle-outline'; label: string; value: string }) {
  return <View accessible accessibilityLabel={`${label} ${value}`} style={styles.item}>
    <AppIcon name={icon} color={colors.primary} size={20} />
    <View><AppText style={styles.label}>{label}</AppText><AppText style={styles.value}>{value}</AppText></View>
  </View>;
}

export const ConnectionTimeline = memo(ConnectionTimelineComponent);

const styles = StyleSheet.create({
  surface: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { width: StyleSheet.hairlineWidth, height: spacing.huge, backgroundColor: colors.border },
  label: { ...typography.small, color: colors.muted },
  value: { ...typography.label, color: colors.text },
});
