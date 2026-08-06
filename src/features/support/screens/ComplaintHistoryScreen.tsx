import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  AppScreen,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { ComplaintCard } from '@/features/support/components';
import { useCustomerNavigation } from '@/navigation';
import { queryKeys } from '@/services/query';
import { supportService, type Complaint } from '@/services/support';
import { useAuthStore } from '@/store/auth.store';
import { spacing } from '@/theme';
import { getScreenMetrics } from '@/utils/responsive';

export default function ComplaintHistoryScreen() {
  const navigation = useCustomerNavigation();
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics(width, insets.bottom);
  const query = useQuery({
    queryKey: queryKeys.supportComplaints(connectionId),
    queryFn: () => supportService.getComplaints(connectionId),
    staleTime: 30_000,
  });
  const renderItem = useCallback(
    ({ item }: { item: Complaint }) => (
      <ComplaintCard
        complaint={item}
        onPress={() => navigation.navigate('ComplaintDetail', { id: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="My tickets"
        subtitle="Track complaints and resolutions"
        showBack
      />
      {query.isPending ? (
        <View style={styles.loading}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </View>
      ) : query.isError ? (
        <ErrorState
          title="Tickets unavailable"
          message="We couldn't load your complaint history."
          retry={() => void query.refetch()}
        />
      ) : (
        <FlatList
          data={query.data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: metrics.bottomPadding },
          ]}
          ItemSeparatorComponent={TicketSeparator}
          ListEmptyComponent={
            <EmptyState
              title="No tickets yet"
              message="Your support requests will appear here."
            />
          }
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      )}
    </AppScreen>
  );
}

function TicketSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: spacing.none },
  loading: { gap: spacing.lg },
  list: { flexGrow: 1 },
  separator: { height: spacing.md },
});
