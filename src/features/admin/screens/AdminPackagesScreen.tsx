import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  EmptyState,
  ErrorState,
} from '@/components';
import {
  PackageFilterBar,
  PackageListItem,
  PackageListSkeleton,
  PackageMockNotice,
  PackageSummaryGrid,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { packagesService } from '@/services/api';
import type {
  AdminPackage,
  PackageStatusFilter,
} from '@/services/api/packages.models';
import { queryKeys } from '@/services/query';
import { animation, colors, radius, spacing } from '@/theme';

const emptyPackages: AdminPackage[] = [];

export default function AdminPackagesScreen() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PackageStatusFilter>('all');
  const packagesQuery = useQuery({
    queryKey: queryKeys.adminPackageList,
    queryFn: packagesService.list,
  });
  const packages = packagesQuery.data ?? emptyPackages;
  const filteredPackages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return packages.filter(item => {
      const matchesStatus = status === 'all' || item.status === status;
      const searchable = [
        item.name,
        item.speedMbps.toString(),
        ...item.features,
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && searchable.includes(term);
    });
  }, [packages, search, status]);

  const renderPackage = useCallback(
    ({ item }: { item: AdminPackage }) => (
      <PackageListItem
        packageItem={item}
        onPress={() => navigation.navigate('PackageDetail', { id: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Package management"
        subtitle="Manage the admin service catalogue"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create package"
            onPress={() => navigation.navigate('PackageCreate')}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          >
            <AppIcon name="add" color={colors.textOnAccent} size={25} />
          </Pressable>
        }
      />
      <View style={styles.notice}>
        <PackageMockNotice />
      </View>

      {packagesQuery.isPending ? (
        <PackageListSkeleton />
      ) : packagesQuery.isError ? (
        <ErrorState
          title="Packages unavailable"
          message="The admin package catalogue could not be loaded."
          retry={() => void packagesQuery.refetch()}
        />
      ) : (
        <>
          <PackageSummaryGrid packages={packages} />
          <PackageFilterBar
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
          <FlatList
            style={styles.list}
            data={filteredPackages}
            keyExtractor={item => item.id}
            renderItem={renderPackage}
            ItemSeparatorComponent={ListSeparator}
            ListEmptyComponent={
              <EmptyState
                title="No packages found"
                message="Try a different search or status filter."
                icon="cube-outline"
              />
            }
            contentContainerStyle={[
              styles.content,
              filteredPackages.length === 0 && styles.empty,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshing={packagesQuery.isRefetching}
            onRefresh={() => void packagesQuery.refetch()}
            initialNumToRender={8}
            windowSize={7}
          />
        </>
      )}
    </AppScreen>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notice: { marginBottom: spacing.lg },
  list: { flex: 1 },
  content: { paddingBottom: spacing.huge },
  empty: { flexGrow: 1 },
  separator: { height: spacing.md },
  add: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: animation.opacity.pressed },
});
