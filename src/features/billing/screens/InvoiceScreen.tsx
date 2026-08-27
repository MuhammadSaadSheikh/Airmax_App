import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { InvoiceCard } from '@/features/billing/components';
import { useCustomerNavigation } from '@/navigation';
import { useCustomerInvoices, type Invoice } from '@/services/billing';
import { useCustomerProfile } from '@/services/customer/customerQueries';
import { animation, colors, spacing, typography } from '@/theme';

export default function InvoiceScreen() {
  const navigation = useCustomerNavigation();
  const profileQuery = useCustomerProfile();
  const query = useCustomerInvoices(profileQuery.data?.id);
  const renderItem = useCallback(
    ({ item, index }: { item: Invoice; index: number }) => (
      <InvoiceCard
        invoice={item}
        delay={index * animation.duration.instant}
        onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}
      />
    ),
    [navigation],
  );
  const separator = useCallback(() => <View style={styles.separator} />, []);
  if (profileQuery.isPending || query.isPending)
    return (
      <AppScreen>
        <AppHeader title="Invoice center" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </View>
      </AppScreen>
    );
  if (profileQuery.isError || query.isError)
    return (
      <AppScreen>
        <AppHeader title="Invoice center" showBack />
        <ErrorState
          title="Invoices unavailable"
          message="We couldn't load your invoices."
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
          <View>
            <AppHeader
              title="Invoice center"
              subtitle="Current and past invoices"
              showBack
            />
            <AppText style={styles.sectionTitle}>All invoices</AppText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No invoices"
            message="Your generated invoices will appear here."
            icon="documents-outline"
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
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.lg,
  },
});
