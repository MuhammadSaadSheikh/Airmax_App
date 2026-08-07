import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { SkeletonCard } from './SkeletonCard';

function SkeletonLayout({ rows }: { rows: readonly number[] }) {
  return (
    <View
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
      style={styles.layout}
    >
      {rows.map((lines, index) => (
        <SkeletonCard key={`${lines}-${index}`} lines={lines} />
      ))}
    </View>
  );
}

export const DashboardSkeleton = () => <SkeletonLayout rows={[4, 2, 3]} />;
export const PackageSkeleton = () => <SkeletonLayout rows={[4, 4, 3]} />;
export const BillingSkeleton = () => <SkeletonLayout rows={[4, 3, 4]} />;
export const SupportSkeleton = () => <SkeletonLayout rows={[3, 4, 4]} />;
export const NotificationSkeleton = () => <SkeletonLayout rows={[3, 4, 4]} />;

const styles = StyleSheet.create({ layout: { gap: spacing.lg } });
