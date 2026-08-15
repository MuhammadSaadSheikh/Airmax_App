import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import { environment } from '@/config/environment';
import {
  SubscriptionFilterBar,
  SubscriptionListItem,
  SubscriptionListSkeleton,
  SubscriptionMockNotice,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { subscriptionsService } from '@/services/api';
import type {
  AdminSubscription,
  SubscriptionStatusFilter,
} from '@/services/api/subscriptions.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

const emptySubscriptions: AdminSubscription[] = [];

export default function AdminSubscriptionsScreen() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SubscriptionStatusFilter>('all');
  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.adminSubscriptionList,
    queryFn: subscriptionsService.listSubscriptions,
  });

  const subscriptions = subscriptionsQuery.data ?? emptySubscriptions;
  const filteredSubscriptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subscriptions.filter(subscription => {
      const matchesStatus = status === 'all' || subscription.status === status;
      const searchable = [
        subscription.id,
        subscription.customer.name,
        subscription.customer.connectionId ?? '',
        subscription.package.name,
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && searchable.includes(term);
    });
  }, [search, status, subscriptions]);

  const renderSubscription = useCallback(
    ({ item }: { item: AdminSubscription }) => (
      <SubscriptionListItem
        subscription={item}
        onPress={() =>
          navigation.navigate('SubscriptionDetail', { id: item.id })
        }
      />
    ),
    [navigation],
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Subscription center"
        subtitle="Manage customer package lifecycles"
        showBack
      />
      {environment.useMockApi ? (
        <View style={styles.notice}>
          <SubscriptionMockNotice />
        </View>
      ) : null}
      {subscriptionsQuery.isPending ? (
        <SubscriptionListSkeleton />
      ) : subscriptionsQuery.isError ? (
        <ErrorState
          title="Subscriptions unavailable"
          message="We couldn’t load subscription management data."
          retry={() => void subscriptionsQuery.refetch()}
        />
      ) : (
        <>
          <SubscriptionFilterBar
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
          <FlatList
            style={styles.list}
            data={filteredSubscriptions}
            keyExtractor={item => item.id}
            renderItem={renderSubscription}
            ItemSeparatorComponent={ListSeparator}
            ListEmptyComponent={
              <EmptyState
                title="No subscriptions found"
                message="Try a different search or status filter."
                icon="repeat-outline"
              />
            }
            contentContainerStyle={[
              styles.content,
              filteredSubscriptions.length === 0 && styles.empty,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshing={subscriptionsQuery.isRefetching}
            onRefresh={() => void subscriptionsQuery.refetch()}
            initialNumToRender={10}
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
});
