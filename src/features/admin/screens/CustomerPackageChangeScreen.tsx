import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  PrimaryButton,
  SkeletonCard,
} from '@/components';
import {
  CustomerPackageOption,
  MockActionNotice,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { environment } from '@/config/environment';
import { customersService } from '@/services/api';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<
  AdminStackParamList,
  'CustomerPackageChange'
>;

export default function CustomerPackageChangeScreen({
  navigation,
  route,
}: Props) {
  const customerId = route.params.id;
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const customerQuery = useQuery({
    queryKey: queryKeys.adminCustomerDetail(customerId),
    queryFn: () => customersService.getById(customerId),
  });
  const packagesQuery = useQuery({
    queryKey: queryKeys.adminCustomerPackageOptions,
    queryFn: customersService.listPackageOptions,
    enabled: environment.useMockApi,
  });

  const currentPackageId = customerQuery.data?.latestSubscription?.package.id;
  const effectiveSelectedId = selectedId ?? currentPackageId;

  const mutation = useMutation({
    mutationFn: (packageId: string) =>
      customersService.changePackage({ customerId, packageId }),
    onSuccess: async customer => {
      queryClient.setQueryData(
        queryKeys.adminCustomerDetail(customer.id),
        customer,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminCustomerLists,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminCustomerDetail(customer.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminSubscriptions,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminCustomerSubscriptions(customer.id),
        }),
      ]);
      navigation.goBack();
    },
  });

  if (!environment.useMockApi) {
    return (
      <AppScreen>
        <AppHeader title="Change package" showBack />
        <ErrorState
          title="Mock action unavailable"
          message="Package changes are available in mock mode only."
        />
      </AppScreen>
    );
  }

  if (customerQuery.isPending || packagesQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Change package" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </View>
      </AppScreen>
    );
  }

  if (customerQuery.isError || packagesQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Change package" showBack />
        <ErrorState
          title="Packages unavailable"
          message="The mock package catalogue could not be loaded."
          retry={() => {
            void customerQuery.refetch();
            void packagesQuery.refetch();
          }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Change package"
        subtitle={customerQuery.data.name}
        showBack
      />
      <MockActionNotice />
      <View accessibilityRole="radiogroup" style={styles.options}>
        {packagesQuery.data.length > 0 ? (
          packagesQuery.data.map(option => (
            <CustomerPackageOption
              key={option.id}
              option={option}
              current={option.id === currentPackageId}
              selected={option.id === effectiveSelectedId}
              onPress={() => setSelectedId(option.id)}
            />
          ))
        ) : (
          <EmptyState
            title="No packages"
            message="The mock package catalogue is empty."
            icon="cube-outline"
          />
        )}
      </View>
      {mutation.isError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'The package could not be changed.'}
        </AppText>
      ) : null}
      <PrimaryButton
        title={currentPackageId ? 'Apply package change' : 'Assign package'}
        icon="swap-horizontal-outline"
        loading={mutation.isPending}
        disabled={
          !effectiveSelectedId || effectiveSelectedId === currentPackageId
        }
        onPress={() =>
          effectiveSelectedId && mutation.mutate(effectiveSelectedId)
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  loading: { gap: spacing.lg },
  options: { gap: spacing.md, marginTop: spacing.lg },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.md,
  },
});
