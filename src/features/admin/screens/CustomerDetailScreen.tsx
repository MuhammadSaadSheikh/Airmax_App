import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  SkeletonCard,
} from '@/components';
import {
  CustomerConnectionCard,
  CustomerContactCard,
  CustomerProfileHeader,
  CustomerSubscriptionCard,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { customersService } from '@/services/api';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ route }: Props) {
  const customerQuery = useQuery({
    queryKey: queryKeys.adminCustomerDetail(route.params.id),
    queryFn: () => customersService.getById(route.params.id),
  });

  if (customerQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Customer details" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </View>
      </AppScreen>
    );
  }

  if (customerQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Customer details" showBack />
        <ErrorState
          title="Customer unavailable"
          message="This customer record could not be loaded."
          retry={() => void customerQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const customer = customerQuery.data;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Customer details"
        subtitle={customer.connectionId ?? undefined}
        showBack
      />
      <CustomerProfileHeader customer={customer} />

      <SectionTitle title="Contact information" />
      <CustomerContactCard customer={customer} />

      <SectionTitle title="Connection" />
      <CustomerConnectionCard customer={customer} />

      <SectionTitle title="Latest subscription" />
      <CustomerSubscriptionCard subscription={customer.latestSubscription} />
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  loading: { gap: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
});
