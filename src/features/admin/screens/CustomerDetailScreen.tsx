import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  SkeletonCard,
} from '@/components';
import {
  CustomerActionPanel,
  CustomerConnectionCard,
  CustomerContactCard,
  CustomerProfileHeader,
  CustomerSubscriptionCard,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { environment } from '@/config/environment';
import { customersService } from '@/services/api';
import type {
  AdminCustomerDetail,
  SuspensionReason,
} from '@/services/api/customers.models';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const customerId = route.params.id;
  const customerQuery = useQuery({
    queryKey: queryKeys.adminCustomerDetail(customerId),
    queryFn: () => customersService.getById(customerId),
  });

  const synchronizeCustomer = (customer: AdminCustomerDetail) => {
    queryClient.setQueryData(
      queryKeys.adminCustomerDetail(customer.id),
      customer,
    );
    void queryClient.invalidateQueries({
      queryKey: queryKeys.adminCustomerLists,
    });
  };

  const activateMutation = useMutation({
    mutationFn: () => customersService.activateCustomer(customerId),
    onSuccess: synchronizeCustomer,
  });
  const suspendMutation = useMutation({
    mutationFn: (reason: SuspensionReason) =>
      customersService.suspendCustomer({ customerId, reason }),
    onSuccess: synchronizeCustomer,
  });

  const confirmActivation = () =>
    Alert.alert(
      'Activate customer',
      'Activate this customer and their latest subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => activateMutation.mutate(),
        },
      ],
    );

  const confirmSuspension = (reason: SuspensionReason) =>
    Alert.alert(
      'Suspend customer',
      `Suspend this customer for ${reason.replaceAll('-', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () => suspendMutation.mutate(reason),
        },
      ],
    );

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
  const actionError = activateMutation.error ?? suspendMutation.error;

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

      {environment.useMockApi ? (
        <>
          <SectionTitle title="Administrative actions" />
          <CustomerActionPanel
            customer={customer}
            loading={activateMutation.isPending || suspendMutation.isPending}
            onActivate={confirmActivation}
            onSuspend={confirmSuspension}
            onEdit={() =>
              navigation.navigate('CustomerEdit', { id: customer.id })
            }
            onChangePackage={() =>
              navigation.navigate('CustomerPackageChange', {
                id: customer.id,
              })
            }
          />
          {activateMutation.isError || suspendMutation.isError ? (
            <AppText accessibilityRole="alert" style={styles.error}>
              {actionError instanceof Error
                ? actionError.message
                : 'The customer action could not be completed.'}
            </AppText>
          ) : null}
        </>
      ) : null}
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
  error: { ...typography.small, color: colors.danger },
});
