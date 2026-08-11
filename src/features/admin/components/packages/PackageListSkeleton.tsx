import { StyleSheet, View } from 'react-native';
import { SkeletonCard } from '@/components';
import { spacing } from '@/theme';

export function PackageListSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading packages"
      style={styles.container}
    >
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.md } });
