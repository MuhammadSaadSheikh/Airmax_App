import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { AppHeader, AppScreen, AppText, PrimaryButton } from '@/components';
import {
  PackageInformationForm,
  PackageMockNotice,
} from '@/features/admin/components';
import {
  packageInformationSchema,
  packageValuesToInput,
  type PackageInformationValues,
} from '@/features/admin/package.schema';
import type { AdminStackParamList } from '@/navigation';
import {
  adminActionPermissions,
  adminAuditEvents,
  runProtectedAdminAction,
} from '@/features/admin/security';
import { useAdminAudit } from '@/features/admin/security/useAdminAudit';
import { packagesService } from '@/services/api';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'PackageCreate'>;

const emptyValues: PackageInformationValues = {
  name: '',
  speedMbps: '',
  price: '',
  durationDays: '30',
  description: '',
  features: '',
};

export default function PackageCreateScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const recordAudit = useAdminAudit();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PackageInformationValues>({
    resolver: zodResolver(packageInformationSchema),
    defaultValues: emptyValues,
  });
  const mutation = useMutation({
    mutationFn: (values: PackageInformationValues) =>
      runProtectedAdminAction(
        adminActionPermissions.createPackage(),
        'create package',
        'packages',
        () => packagesService.create(packageValuesToInput(values)),
      ),
    onSuccess: async packageItem => {
      queryClient.setQueryData(
        queryKeys.adminPackageDetail(packageItem.id),
        packageItem,
      );
      await invalidateAdminMutation(queryClient, 'package');
      await recordAudit(
        adminAuditEvents.packageChanged(
          packageItem.id,
          'created',
          packageItem.name,
        ),
      );
      navigation.replace('PackageDetail', { id: packageItem.id });
    },
  });

  return (
    <AppScreen keyboardShouldPersistTaps="handled">
      <AppHeader
        title="Create package"
        subtitle="Configure a new admin catalogue plan"
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
            : 'The package could not be created.'}
        </AppText>
      ) : null}
      <PrimaryButton
        title="Create package"
        icon="add-circle-outline"
        loading={mutation.isPending}
        onPress={handleSubmit(values => mutation.mutate(values))}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
});
