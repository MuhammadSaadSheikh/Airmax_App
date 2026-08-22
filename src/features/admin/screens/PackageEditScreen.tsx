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
} from '@/components';
import {
  AdminDetailSkeleton,
  PackageInformationForm,
  PackageMockNotice,
} from '@/features/admin/components';
import {
  packageInformationSchema,
  packageValuesToInput,
  type PackageInformationValues,
} from '@/features/admin/package.schema';
import type { AdminStackParamList } from '@/navigation';
import { packagesService } from '@/services/api';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'PackageEdit'>;

const emptyValues: PackageInformationValues = {
  name: '',
  speedMbps: '',
  price: '',
  durationDays: '',
  description: '',
  features: '',
};

export default function PackageEditScreen({ navigation, route }: Props) {
  const packageId = route.params.id;
  const queryClient = useQueryClient();
  const packageQuery = useQuery({
    queryKey: queryKeys.adminPackageDetail(packageId),
    queryFn: () => packagesService.getById(packageId),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageInformationValues>({
    resolver: zodResolver(packageInformationSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!packageQuery.data) return;
    reset({
      name: packageQuery.data.name,
      speedMbps: packageQuery.data.speedMbps.toString(),
      price: packageQuery.data.price.toString(),
      durationDays: packageQuery.data.durationDays.toString(),
      description: packageQuery.data.description ?? '',
      features: packageQuery.data.features.join('\n'),
    });
  }, [packageQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: PackageInformationValues) =>
      packagesService.update({
        packageId,
        ...packageValuesToInput(values),
      }),
    onSuccess: packageItem => {
      queryClient.setQueryData(
        queryKeys.adminPackageDetail(packageItem.id),
        packageItem,
      );
      void invalidateAdminMutation(queryClient, 'package');
      navigation.goBack();
    },
  });

  if (packageQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Edit package" showBack />
        <AdminDetailSkeleton label="Loading package editor" rows={[7]} />
      </AppScreen>
    );
  }

  if (packageQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Edit package" showBack />
        <ErrorState
          title="Package unavailable"
          message="This package record could not be found or loaded."
          retry={() => void packageQuery.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen keyboardShouldPersistTaps="handled">
      <AppHeader
        title="Edit package"
        subtitle={packageQuery.data.name}
        showBack
      />
      <PackageMockNotice />
      <PackageInformationForm
        control={control}
        errors={errors}
        disabled={mutation.isPending}
      />
      {mutation.isError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'The package could not be updated.'}
        </AppText>
      ) : null}
      <PrimaryButton
        title="Save package"
        icon="checkmark-outline"
        loading={mutation.isPending}
        onPress={handleSubmit(values => mutation.mutate(values))}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
});
