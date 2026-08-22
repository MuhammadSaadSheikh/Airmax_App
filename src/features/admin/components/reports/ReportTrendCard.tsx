import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type { ReportTrendPoint } from '@/services/api/reports.models';
import { colors, radius, spacing, typography } from '@/theme';

export function ReportTrendCard({
  title,
  points,
  formatValue = value => value.toLocaleString('en-PK'),
}: {
  title: string;
  points: ReportTrendPoint[];
  formatValue?: (value: number) => string;
}) {
  const maximum = Math.max(1, ...points.map(point => point.value));
  return (
    <Surface style={styles.card} accessibilityLabel={title}>
      <AppText style={styles.title}>{title}</AppText>
      {points.length === 0 ? (
        <AppText style={styles.empty}>No trend data for this period.</AppText>
      ) : (
        points.map(point => (
          <View key={point.period} style={styles.row}>
            <View style={styles.copy}>
              <AppText style={styles.label}>{point.period}</AppText>
              <AppText style={styles.value}>{formatValue(point.value)}</AppText>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { width: `${(point.value / maximum) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  title: { ...typography.sectionTitle, marginBottom: spacing.md },
  row: { gap: spacing.sm, marginTop: spacing.sm },
  copy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { ...typography.label, color: colors.textSecondary },
  value: { ...typography.label, color: colors.text },
  track: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
  },
  bar: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  empty: { ...typography.body, color: colors.muted },
});
