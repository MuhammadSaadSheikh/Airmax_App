import { StyleSheet, View } from 'react-native';
import { ReportMetricCard, type ReportMetric } from './ReportMetricCard';
import { spacing } from '@/theme';

export function ReportSummaryGrid({
  metrics,
  onMetricPress,
}: {
  metrics: ReportMetric[];
  onMetricPress?: (metric: ReportMetric) => void;
}) {
  return (
    <View style={styles.grid}>
      {metrics.map(metric => (
        <View key={metric.id} style={styles.item}>
          <ReportMetricCard
            metric={metric}
            onPress={onMetricPress ? () => onMetricPress(metric) : undefined}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { width: '48%' },
});
