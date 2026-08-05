import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { NetworkStatus } from '@/services/network';
import { colors, radius, spacing, typography } from '@/theme';
import { FiberStatusCard } from './FiberStatusCard';
import { RouterStatusCard } from './RouterStatusCard';

function NetworkStatusCardComponent({ network }: { network: NetworkStatus }) {
  return (
    <Surface accessibilityLabel="Network status" style={styles.surface}>
      <View style={styles.cards}>
        <RouterStatusCard status={network.routerStatus} />
        <FiberStatusCard status={network.fiberStatus} />
        <View
          accessible
          accessibilityLabel={`Wi-Fi ${network.wifiHealthy ? 'healthy' : 'needs attention'}`}
          style={styles.statusCard}
        >
          <View style={styles.icon}>
            <AppIcon name="wifi-outline" color={colors.primary} size={21} />
          </View>
          <AppText style={styles.label}>Wi-Fi</AppText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: network.wifiHealthy
                    ? colors.success
                    : colors.warning,
                },
              ]}
            />
            <AppText style={styles.status}>
              {network.wifiHealthy ? 'Healthy' : 'Check signal'}
            </AppText>
          </View>
        </View>
      </View>
    </Surface>
  );
}

export const NetworkStatusCard = memo(NetworkStatusCardComponent);

const styles = StyleSheet.create({
  surface: { padding: spacing.sm },
  cards: { flexDirection: 'row', gap: spacing.sm },
  statusCard: {
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
  status: { ...typography.label, color: colors.text, flexShrink: 1 },
});
