import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  PackageSkeleton,
  SecondaryButton,
} from '@/components';
import {
  CurrentPlanCard,
  PackageCard,
  RecommendedPlanCard,
} from '@/features/packages/components';
import { useCustomerNavigation } from '@/navigation';
import type { InternetPackage } from '@/services/packages';
import { authenticatedPackageService } from '@/services/package';
import { useCustomerProfile } from '@/services/customer';
import { queryKeys } from '@/services/query';
import { animation, colors, spacing, typography } from '@/theme';

export default function PackagesScreen() {
  const navigation = useCustomerNavigation();
  const customerQuery = useCustomerProfile();
  const customerId = customerQuery.data?.id;
  const packagesQuery = useQuery({
    queryKey: queryKeys.packageMarketplace,
    queryFn: authenticatedPackageService.getPackages,
    staleTime: 60_000,
  });
  const currentQuery = useQuery({
    queryKey: queryKeys.currentPackage(customerId ?? 'pending'),
    queryFn: () => authenticatedPackageService.getCurrentPackage(customerId!),
    enabled: Boolean(customerId),
    staleTime: 60_000,
  });
  const recommendationQuery = useQuery({
    queryKey: queryKeys.packageRecommendation(customerId ?? 'pending'),
    queryFn: () => authenticatedPackageService.getRecommendations(customerId!),
    enabled: Boolean(customerId),
    staleTime: 60_000,
  });

  const openDetail = useCallback(
    (id: string) => navigation.navigate('PackageDetail', { id }),
    [navigation],
  );
  const openUpgrade = useCallback(
    (id: string) =>
      navigation.navigate('UpgradePackage', { id, action: 'upgrade' }),
    [navigation],
  );
  const openComparison = useCallback(
    () => navigation.navigate('PackageComparison'),
    [navigation],
  );
  const renderPlan = useCallback(
    ({ item, index }: { item: InternetPackage; index: number }) => (
      <PackageCard
        plan={item}
        delay={index * animation.duration.instant}
        onPress={() => openDetail(item.id)}
      />
    ),
    [openDetail],
  );
  const separator = useCallback(() => <View style={styles.separator} />, []);

  const header = useMemo(() => {
    const current = currentQuery.data;
    const recommendation = recommendationQuery.data?.[0];
    const recommendedPlan = packagesQuery.data?.find(
      plan => plan.id === recommendation?.packageId,
    );
    return (
      <View style={styles.headerContent}>
        <AppHeader
          title="Package center"
          subtitle="Find the right AIRMAX plan for your home"
        />
        {current ? (
          <>
            <SectionTitle
              title="Current package"
              subtitle="Your active internet plan"
            />
            <CurrentPlanCard
              plan={{
                id: current.package.id,
                name: current.package.name,
                speedMbps: current.package.speed,
                monthlyPrice: current.package.price,
                billingCycle: current.package.billingCycle,
                expiryDate: current.subscription.expiryDate,
                remainingDays: current.subscription.remainingDays,
              }}
              onUpgrade={() => openComparison()}
              onRenew={() =>
                navigation.navigate('UpgradePackage', {
                  id: current.package.id,
                  action: 'renew',
                })
              }
              onViewDetails={() => openDetail(current.package.id)}
            />
          </>
        ) : null}
        {recommendedPlan && recommendation ? (
          <>
            <SectionTitle
              title="Smart recommendation"
              subtitle="Based on your connection activity"
            />
            <RecommendedPlanCard
              plan={recommendedPlan}
              recommendation={recommendation}
              onUpgrade={() => openUpgrade(recommendedPlan.id)}
            />
          </>
        ) : null}
        <View style={styles.availableHeader}>
          <View style={styles.availableCopy}>
            <AppText style={styles.sectionTitle}>Available plans</AppText>
            <AppText style={styles.sectionSubtitle}>
              Compare speed, benefits and support
            </AppText>
          </View>
          <SecondaryButton
            title="Compare"
            icon="git-compare-outline"
            onPress={openComparison}
          />
        </View>
      </View>
    );
  }, [
    currentQuery.data,
    navigation,
    openComparison,
    openDetail,
    openUpgrade,
    packagesQuery.data,
    recommendationQuery.data,
  ]);

  if (
    packagesQuery.isPending ||
    customerQuery.isPending ||
    currentQuery.isPending ||
    recommendationQuery.isPending
  ) {
    return (
      <AppScreen>
        <AppHeader title="Package center" subtitle="Loading your plans" />
        <PackageSkeleton />
      </AppScreen>
    );
  }
  if (
    packagesQuery.isError ||
    customerQuery.isError ||
    currentQuery.isError ||
    recommendationQuery.isError
  ) {
    return (
      <AppScreen>
        <AppHeader title="Package center" />
        <ErrorState
          title="Packages unavailable"
          message="We couldn't load the package marketplace."
          retry={() => {
            void packagesQuery.refetch();
            void customerQuery.refetch();
            void currentQuery.refetch();
            void recommendationQuery.refetch();
          }}
        />
      </AppScreen>
    );
  }
  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <FlatList
        data={packagesQuery.data}
        keyExtractor={item => item.id}
        renderItem={renderPlan}
        ItemSeparatorComponent={separator}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </AppScreen>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <AppText style={styles.sectionSubtitle}>{subtitle}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingBottom: spacing.huge },
  headerContent: { gap: spacing.lg },
  separator: { height: spacing.md },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  sectionSubtitle: { ...typography.small, color: colors.muted },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  availableCopy: { flex: 1 },
});
