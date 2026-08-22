import { StyleSheet, View } from 'react-native';
import { SkeletonCard } from '@/components';
import { spacing } from '@/theme';

export function AdminDetailSkeleton({
  label,
  rows,
}: {
  label: string;
  rows: readonly number[];
}) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={styles.container}
    >
      {rows.map((lines, index) => (
        <SkeletonCard key={`${lines}-${index}`} lines={lines} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.lg } });
