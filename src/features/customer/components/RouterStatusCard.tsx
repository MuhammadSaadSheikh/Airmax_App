import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import type { EquipmentConnectionStatus } from '@/services/network';
import { colors, radius, spacing, typography } from '@/theme';

function RouterStatusCardComponent({
  status,
}: {
  status: EquipmentConnectionStatus;
}) {
  const connected = status === 'connected';
  return (
    <View
      accessible
      accessibilityLabel={`Router ${status}`}
      style={styles.card}
    >
      <View style={styles.icon}>
        <AppIcon
          name="hardware-chip-outline"
          color={colors.primary}
          size={21}
        />
      </View>
      <AppText style={styles.label}>Router</AppText>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: connected ? colors.success : colors.danger },
          ]}
        />
        <AppText style={styles.status}>
          {connected ? 'Connected' : 'Disconnected'}
        </AppText>
      </View>
    </View>
  );
}

export const RouterStatusCard = memo(RouterStatusCardComponent);

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
