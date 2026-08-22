import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import {
  CustomerFilterBar,
  CustomerListItem,
  CustomerListSkeleton,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { customersService } from '@/services/api';
import type {
  AdminCustomerListItem,
  CustomerStatusFilter,
} from '@/services/api/customers.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

export default function CustomersScreen() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatusFilter>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const customersQuery = useQuery({
    queryKey: queryKeys.adminCustomerList(debouncedSearch),
    queryFn: () => customersService.list({ search: debouncedSearch }),
  });

  const customers = useMemo(
    () =>
      status === 'all'
        ? (customersQuery.data ?? [])
        : (customersQuery.data ?? []).filter(
            customer => customer.status === status,
          ),
    [customersQuery.data, status],
  );

  const renderCustomer = useCallback(
    ({ item }: { item: AdminCustomerListItem }) => (
      <CustomerListItem
        customer={item}
        onPress={() => navigation.navigate('CustomerDetail', { id: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Customer operations"
        subtitle="Read-only account and connection directory"
      />
      <CustomerFilterBar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {customersQuery.isPending ? (
        <CustomerListSkeleton />
      ) : customersQuery.isError ? (
        <ErrorState
          title="Customers unavailable"
          message="We couldn’t load customer operations data."
          retry={() => void customersQuery.refetch()}
        />
      ) : (
        <FlatList
          style={styles.flatList}
          data={customers}
          keyExtractor={item => item.id}
          renderItem={renderCustomer}
          ItemSeparatorComponent={ListSeparator}
          ListEmptyComponent={
            <EmptyState
              title="No customers found"
              message="Try a different search or status filter."
              icon="people-outline"
            />
          }
          contentContainerStyle={[
            styles.list,
            customers.length === 0 && styles.emptyList,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshing={customersQuery.isRefetching}
          onRefresh={() => void customersQuery.refetch()}
          initialNumToRender={10}
          windowSize={7}
        />
      )}
    </AppScreen>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flatList: { flex: 1 },
  list: { paddingBottom: spacing.huge },
  emptyList: { flexGrow: 1 },
  separator: { height: spacing.md },
});
