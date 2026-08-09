import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText, Surface } from '@/components';
import type { DashboardBreakdownItem } from '@/services/api/reports.service';
import { colors, radius, spacing, typography } from '@/theme';

const itemColors: Record<string, string> = {
  pending: colors.warning,
  'in-progress': colors.primary,
  resolved: colors.success,
  basic: colors.primary,
  plus: colors.purple,
  premium: colors.success,
  ultra: colors.warning,
};

export function DashboardBreakdownCard({
  title,
  items,
}: {
  title: string;
  items: DashboardBreakdownItem[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Surface>
      <AppText style={styles.title}>{title}</AppText>
      <View style={styles.items}>
        {items.map(item => {
          const percentage = total === 0 ? 0 : (item.value / total) * 100;
          const width = `${percentage}%` as ViewStyle['width'];
          const color = itemColors[item.id] ?? colors.primary;
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={styles.labelRow}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <AppText style={styles.label}>{item.label}</AppText>
                </View>
                <AppText style={styles.count}>
                  {item.value.toLocaleString('en-PK')}
                </AppText>
              </View>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { backgroundColor: color, width }]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.sectionTitle, color: colors.text },
  items: { gap: spacing.lg, marginTop: spacing.lg },
  item: { gap: spacing.sm },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  label: { ...typography.body, color: colors.textSecondary },
  count: { ...typography.label, color: colors.text },
  track: {
    height: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
