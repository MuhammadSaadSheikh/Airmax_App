import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import type { FiberStatus } from '@/services/network';
import { colors, radius, spacing, typography } from '@/theme';

function FiberStatusCardComponent({ status }: { status: FiberStatus }) {
  const color =
    status === 'active'
      ? colors.success
      : status === 'degraded'
        ? colors.warning
        : colors.danger;
  return (
    <View accessible accessibilityLabel={`Fiber ${status}`} style={styles.card}>
      <View style={styles.icon}>
        <AppIcon name="git-network-outline" color={colors.primary} size={21} />
      </View>
      <AppText style={styles.label}>Fiber</AppText>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <AppText style={styles.status}>
          {status[0]?.toUpperCase()}
          {status.slice(1)}
        </AppText>
      </View>
    </View>
  );
}

export const FiberStatusCard = memo(FiberStatusCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    gap: spacing.sm,
  },
  icon: {
    width: spacing.huge,
    height: spacing.huge,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.small, color: colors.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill },
  status: { ...typography.label, color: colors.text },
});
