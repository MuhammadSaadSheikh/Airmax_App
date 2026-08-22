import { StyleSheet, View } from 'react-native';
import { SkeletonCard } from '@/components';
import { spacing } from '@/theme';

export function AuditSkeleton() {
  return (
    <View testID="audit-skeleton" style={styles.container}>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.md } });
