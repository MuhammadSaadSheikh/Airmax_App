import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { TransactionItem } from '@/features/billing/components';
import { usePaymentHistory, type Payment } from '@/services/billing';
import { useCustomerProfile } from '@/services/customer/customerQueries';
import { spacing } from '@/theme';

export default function PaymentHistoryScreen() {
  const profileQuery = useCustomerProfile();
  const query = usePaymentHistory(profileQuery.data?.id);
  const renderItem = useCallback(
    ({ item }: { item: Payment }) => <TransactionItem payment={item} />,
    [],
  );
  const separator = useCallback(() => <View style={styles.separator} />, []);
  if (profileQuery.isPending || query.isPending)
    return (
      <AppScreen>
        <AppHeader title="Payment history" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </View>
      </AppScreen>
    );
  if (profileQuery.isError || query.isError)
    return (
      <AppScreen>
        <AppHeader title="Payment history" showBack />
        <ErrorState
          title="History unavailable"
          message="We couldn't load your transactions."
          retry={() => {
            void profileQuery.refetch();
            void query.refetch();
          }}
        />
      </AppScreen>
    );
  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <FlatList
        data={query.data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={separator}
        ListHeaderComponent={
          <AppHeader
            title="Payment history"
            subtitle="Transactions and payment references"
            showBack
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No payments yet"
            message="Completed payments will appear here."
            icon="receipt-outline"
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={5}
      />
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingBottom: spacing.huge },
  loading: { gap: spacing.lg },
  separator: { height: spacing.md },
});
