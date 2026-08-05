import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState, SkeletonCard } from '@/components';
import { TransactionItem } from '@/features/billing/components';
import { billingCenterService, type Payment } from '@/services/billing';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';
import { spacing } from '@/theme';

export default function PaymentHistoryScreen() {
  const connectionId = useAuthStore(state => state.user?.connectionId ?? 'unknown');
  const query = useQuery({ queryKey: queryKeys.paymentHistory(connectionId), queryFn: () => billingCenterService.getPaymentHistory(connectionId), staleTime: 30_000 });
  const renderItem = useCallback(({ item }: { item: Payment }) => <TransactionItem payment={item} />, []);
  const separator = useCallback(() => <View style={styles.separator} />, []);
  if (query.isPending) return <AppScreen><AppHeader title="Payment history" showBack /><View style={styles.loading}><SkeletonCard lines={3} /><SkeletonCard lines={3} /></View></AppScreen>;
  if (query.isError) return <AppScreen><AppHeader title="Payment history" showBack /><ErrorState title="History unavailable" message="We couldn't load your transactions." retry={() => void query.refetch()} /></AppScreen>;
  return <AppScreen scroll={false} contentContainerStyle={styles.screen}><FlatList data={query.data} keyExtractor={item => item.id} renderItem={renderItem} ItemSeparatorComponent={separator} ListHeaderComponent={<AppHeader title="Payment history" subtitle="Transactions and payment references" showBack />} ListEmptyComponent={<EmptyState title="No payments yet" message="Completed payments will appear here." icon="receipt-outline" />} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} initialNumToRender={6} windowSize={5} /></AppScreen>;
}
const styles = StyleSheet.create({ screen: { flex: 1 }, list: { paddingBottom: spacing.huge }, loading: { gap: spacing.lg }, separator: { height: spacing.md } });
