import { StyleSheet, View } from 'react-native';
import { SkeletonCard } from '@/components';
import { spacing } from '@/theme';

export function ReportSkeleton() {
  return (
    <View
      testID="report-skeleton"
      accessibilityLabel="Loading report"
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={styles.container}
    >
      <View style={styles.grid}>
        <View style={styles.item}>
          <SkeletonCard lines={2} />
        </View>
        <View style={styles.item}>
          <SkeletonCard lines={2} />
        </View>
        <View style={styles.item}>
          <SkeletonCard lines={2} />
        </View>
        <View style={styles.item}>
          <SkeletonCard lines={2} />
        </View>
      </View>
      <SkeletonCard lines={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { width: '48%' },
});
