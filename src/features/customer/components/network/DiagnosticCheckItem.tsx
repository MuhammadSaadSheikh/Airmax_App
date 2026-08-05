import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { AppIcon, AppText } from '@/components';
import type { DiagnosticCheck } from '@/services/network';
import { animation, colors, radius, spacing, typography } from '@/theme';

function DiagnosticCheckItemComponent({ check, delay = 0 }: { check: DiagnosticCheck; delay?: number }) {
  const color = check.status === 'healthy' ? colors.success : check.status === 'warning' ? colors.warning : colors.danger;
  const icon = check.status === 'healthy' ? 'checkmark-circle' : check.status === 'warning' ? 'warning' : 'close-circle';
  return (
    <Animated.View accessible accessibilityLabel={`${check.label}, ${check.detail}`} entering={FadeInLeft.delay(delay).duration(animation.duration.normal)} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${color}1A` }]}><AppIcon name={icon} color={color} size={22} /></View>
      <View style={styles.copy}><AppText style={styles.label}>{check.label}</AppText><AppText style={styles.detail}>{check.detail}</AppText></View>
    </Animated.View>
  );
}

export const DiagnosticCheckItem = memo(DiagnosticCheckItemComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  icon: { width: spacing.huge + spacing.sm, height: spacing.huge + spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  label: { ...typography.label, color: colors.text },
  detail: { ...typography.small, color: colors.muted },
});
