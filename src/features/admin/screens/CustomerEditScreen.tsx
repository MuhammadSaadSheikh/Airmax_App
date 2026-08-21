import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  PrimaryButton,
  SkeletonCard,
} from '@/components';
import {
  CustomerInformationForm,
  MockActionNotice,
} from '@/features/admin/components';
import {
  customerInformationSchema,
  type CustomerInformationValues,
} from '@/features/admin/customer.schema';
import type { AdminStackParamList } from '@/navigation';
import { environment } from '@/config/environment';
import { customersService } from '@/services/api';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'CustomerEdit'>;

const emptyValues: CustomerInformationValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
  cnic: '',
};

export default function CustomerEditScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const customerId = route.params.id;
  const customerQuery = useQuery({
    queryKey: queryKeys.adminCustomerDetail(customerId),
    queryFn: () => customersService.getById(customerId),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInformationValues>({
    resolver: zodResolver(customerInformationSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!customerQuery.data) return;
    reset({
      name: customerQuery.data.name,
      phone: customerQuery.data.phone,
      email: customerQuery.data.email ?? '',
      address: customerQuery.data.address ?? '',
      cnic: customerQuery.data.cnic ?? '',
    });
  }, [customerQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: CustomerInformationValues) =>
      customersService.updateCustomerInformation({
        customerId,
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        address: values.address || null,
        cnic: values.cnic || null,
      }),
    onSuccess: customer => {
      queryClient.setQueryData(
        queryKeys.adminCustomerDetail(customer.id),
        customer,
      );
      void invalidateAdminMutation(queryClient, 'customer');
      navigation.goBack();
    },
  });

  if (!environment.useMockApi) {
    return (
      <AppScreen>
        <AppHeader title="Edit customer" showBack />
        <ErrorState
          title="Mock action unavailable"
          message="Customer editing is available in mock mode only."
        />
      </AppScreen>
    );
  }

  if (customerQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Edit customer" showBack />
        <SkeletonCard lines={7} />
      </AppScreen>
    );
  }

  if (customerQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Edit customer" showBack />
        <ErrorState
          title="Customer unavailable"
          message="The customer information could not be loaded."
          retry={() => void customerQuery.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen keyboardShouldPersistTaps="handled">
      <AppHeader
        title="Edit customer"
        subtitle={customerQuery.data.name}
        showBack
      />
      <MockActionNotice />
      <CustomerInformationForm control={control} errors={errors} />
      {mutation.isError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Customer information could not be saved.'}
        </AppText>
      ) : null}
      <PrimaryButton
        title="Save customer information"
        icon="checkmark-outline"
        loading={mutation.isPending}
        onPress={handleSubmit(values => mutation.mutate(values))}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.sm,
  },
});
