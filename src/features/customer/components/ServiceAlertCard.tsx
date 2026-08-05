import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { ServiceAlert } from '@/services/network';
import { colors, radius, spacing, typography } from '@/theme';

function ServiceAlertCardComponent({ alert }: { alert: ServiceAlert }) {
  const accent =
    alert.tone === 'danger'
      ? colors.danger
      : alert.tone === 'warning'
        ? colors.warning
        : colors.primary;
  return (
    <Surface
      accessible
      accessibilityLabel={`${alert.title}. ${alert.message}`}
      style={[styles.card, { borderLeftColor: accent }]}
    >
      <View style={[styles.icon, { backgroundColor: `${accent}1A` }]}>
        <AppIcon name={alert.icon} color={accent} size={21} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>{alert.title}</AppText>
        <AppText style={styles.message}>{alert.message}</AppText>
      </View>
    </Surface>
  );
}

export const ServiceAlertCard = memo(ServiceAlertCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderLeftWidth: spacing.xs,
  },
  icon: {
    width: spacing.huge + spacing.sm,
    height: spacing.huge + spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...typography.label, color: colors.text },
  message: { ...typography.small, color: colors.muted },
});
