import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText, Surface } from '@/components';
import type {
  AnalyticsDataSource,
  DashboardBreakdownItem,
} from '@/services/api/reports.models';
import { colors, radius, spacing, typography } from '@/theme';
import { AnalyticsSourceBadge } from './AnalyticsSourceBadge';

const itemPresentation: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.warning },
  'in-progress': { label: 'In progress', color: colors.primary },
  resolved: { label: 'Resolved', color: colors.success },
  basic: { label: 'Basic', color: colors.primary },
  plus: { label: 'Air Plus', color: colors.purple },
  premium: { label: 'Premium', color: colors.success },
  ultra: { label: 'Ultra Fiber', color: colors.warning },
};

export function DashboardBreakdownCard({
  title,
  items,
  source,
}: {
  title: string;
  items: DashboardBreakdownItem[];
  source: AnalyticsDataSource;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Surface>
      <View style={styles.titleRow}>
        <AppText style={styles.title}>{title}</AppText>
        <AnalyticsSourceBadge source={source} />
      </View>
      <View style={styles.items}>
        {items.map(item => {
          const percentage = total === 0 ? 0 : (item.value / total) * 100;
          const width = `${percentage}%` as ViewStyle['width'];
          const presentation = itemPresentation[item.id] ?? {
            label: item.id,
            color: colors.primary,
          };
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={styles.labelRow}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: presentation.color },
                    ]}
                  />
                  <AppText style={styles.label}>{presentation.label}</AppText>
                </View>
                <AppText style={styles.count}>
                  {item.value.toLocaleString('en-PK')}
                </AppText>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: presentation.color, width },
                  ]}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
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
