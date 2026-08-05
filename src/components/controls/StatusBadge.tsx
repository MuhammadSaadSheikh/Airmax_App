import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { AppText } from '@/components/foundation/AppText';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger';

export function StatusBadge({
  label,
  tone = 'info',
}: {
  label: string;
  tone?: StatusTone;
}) {
  const color =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.primary;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}1A`, borderColor: `${color}55` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText style={[styles.label, { color }]}>
        {label.toUpperCase().replaceAll('_', ' ')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm - 2,
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  label: {
    ...typography.small,
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
  },
});
