import { StyleSheet, View } from 'react-native';
import { SkeletonCard } from '@/components';
import { spacing } from '@/theme';

export function TechnicianListSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading technicians"
      style={styles.container}
    >
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.md } });
