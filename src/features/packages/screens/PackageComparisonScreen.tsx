import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { PackageComparisonTable } from '@/features/packages/components';
import { useCustomerNavigation } from '@/navigation';
import { authenticatedPackageService } from '@/services/package';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

export default function PackageComparisonScreen() {
  const navigation = useCustomerNavigation();
  const query = useQuery({
    queryKey: queryKeys.packageComparison,
    queryFn: () => authenticatedPackageService.comparePackages(),
    staleTime: 60_000,
  });
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Compare plans"
        subtitle="See every plan side by side"
        showBack
      />
      {query.isPending ? (
        <View style={styles.loading}>
          <SkeletonCard lines={6} />
          <SkeletonCard lines={3} />
        </View>
      ) : query.isError ? (
        <ErrorState
          title="Comparison unavailable"
          message="We couldn't compare packages right now."
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          <AppText style={styles.intro}>
            Compare speed, price, entertainment and support before you choose.
          </AppText>
          <PackageComparisonTable
            comparison={query.data}
            onChoose={id =>
              navigation.navigate('UpgradePackage', { id, action: 'upgrade' })
            }
          />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  loading: { gap: spacing.lg },
  intro: { ...typography.body, color: colors.textSecondary },
});
