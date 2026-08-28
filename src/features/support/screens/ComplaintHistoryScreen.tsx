import { useCallback } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  AppScreen,
  EmptyState,
  ErrorState,
  SupportSkeleton,
} from '@/components';
import { ComplaintCard } from '@/features/support/components';
import { useCustomerNavigation } from '@/navigation';
import { useCustomerProfile } from '@/services/customer';
import { useCustomerComplaints, type Complaint } from '@/services/support';
import { spacing } from '@/theme';
import { getScreenMetrics } from '@/utils/responsive';

export default function ComplaintHistoryScreen() {
  const navigation = useCustomerNavigation();
  const customerQuery = useCustomerProfile();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics(width, insets.bottom);
  const query = useCustomerComplaints(customerQuery.data?.id);
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
      {customerQuery.isPending || query.isPending ? (
        <SupportSkeleton />
      ) : customerQuery.isError || query.isError ? (
        <ErrorState
          title="Tickets unavailable"
          message="We couldn't load your complaint history."
          retry={() => {
            void customerQuery.refetch();
            void query.refetch();
          }}
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
  list: { flexGrow: 1 },
  separator: { height: spacing.md },
});
