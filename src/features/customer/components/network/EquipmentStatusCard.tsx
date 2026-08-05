import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface, type AppIconName } from '@/components';
import type { EquipmentStatus } from '@/services/network';
import { colors, radius, spacing, typography } from '@/theme';

function EquipmentStatusCardComponent({ equipment }: { equipment: EquipmentStatus }) {
  return (
    <Surface accessibilityLabel="Network equipment status" style={styles.surface}>
      <StatusRow icon="hardware-chip-outline" label="Router" value={equipment.routerStatus} healthy={equipment.routerStatus === 'connected'} />
      <StatusRow icon="git-network-outline" label="Fiber" value={equipment.fiberStatus} healthy={equipment.fiberStatus === 'active'} />
      <StatusRow icon="wifi-outline" label="Wi-Fi" value={equipment.wifiStatus} healthy={equipment.wifiStatus === 'healthy'} />
    </Surface>
  );
}

function StatusRow({ icon, label, value, healthy }: { icon: AppIconName; label: string; value: string; healthy: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label} ${value}`} style={styles.row}>
      <View style={styles.icon}><AppIcon name={icon} color={colors.primary} size={21} /></View>
      <View style={styles.copy}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText style={styles.value}>{value[0]?.toUpperCase()}{value.slice(1)}</AppText>
      </View>
      <View style={[styles.dot, { backgroundColor: healthy ? colors.success : colors.warning }]} />
    </View>
  );
}

export const EquipmentStatusCard = memo(EquipmentStatusCardComponent);

const styles = StyleSheet.create({
  surface: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  icon: { width: spacing.huge + spacing.sm, height: spacing.huge + spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAccent },
  copy: { flex: 1 },
  label: { ...typography.small, color: colors.muted },
  value: { ...typography.label, color: colors.text },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill },
});
