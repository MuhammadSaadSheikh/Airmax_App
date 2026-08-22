import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, AppText, ErrorState } from '@/components';
import {
  AdminDetailSkeleton,
  PackageActionPanel,
  PackageMetricsCard,
  PackageMockNotice,
  PackageProfileHeader,
} from '@/features/admin/components';
import {
  adminAuditEvents,
  adminActionPermissions,
  createAdminConfirmation,
  runProtectedAdminAction,
} from '@/features/admin/security';
import { useAdminAudit } from '@/features/admin/security/useAdminAudit';
import type { AdminStackParamList } from '@/navigation';
import { packagesService } from '@/services/api';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'PackageDetail'>;

export default function PackageDetailScreen({ navigation, route }: Props) {
  const packageId = route.params.id;
  const queryClient = useQueryClient();
  const recordAudit = useAdminAudit();
  const packageQuery = useQuery({
    queryKey: queryKeys.adminPackageDetail(packageId),
    queryFn: () => packagesService.getById(packageId),
  });

  const synchronizePackage = () =>
    invalidateAdminMutation(queryClient, 'package');

  const activateMutation = useMutation({
    mutationFn: () =>
      runProtectedAdminAction(
        adminActionPermissions.activatePackage(),
        'activate package',
        'packages',
        () => packagesService.activate(packageId),
      ),
    onSuccess: async packageResult => {
      await synchronizePackage();
      await recordAudit(
        adminAuditEvents.packageChanged(
          packageResult.id,
          'activated',
          packageResult.name,
        ),
      );
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: () =>
      runProtectedAdminAction(
        adminActionPermissions.deactivatePackage(),
        'deactivate package',
        'packages',
        () => packagesService.deactivate(packageId),
      ),
    onSuccess: async packageResult => {
      await synchronizePackage();
      await recordAudit(
        adminAuditEvents.packageChanged(
          packageResult.id,
          'deactivated',
          packageResult.name,
        ),
      );
    },
  });

  if (packageQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Package details" showBack />
        <AdminDetailSkeleton label="Loading package details" rows={[3, 5]} />
      </AppScreen>
    );
  }

  if (packageQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Package details" showBack />
        <ErrorState
          title="Package unavailable"
          message="This package record could not be found or loaded."
          retry={() => void packageQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const packageItem = packageQuery.data;
  const mutationError = activateMutation.error ?? deactivateMutation.error;
  const loading = activateMutation.isPending || deactivateMutation.isPending;
  const confirmStatusChange = () => {
    const deactivating = packageItem.status === 'active';
    const confirmation = createAdminConfirmation({
      actionName: deactivating ? 'Deactivate package' : 'Activate package',
      affectedEntity: `${packageItem.name} (${packageItem.id})`,
      confirmLabel: deactivating ? 'Deactivate' : 'Activate',
      destructive: deactivating,
      onConfirm: () =>
        deactivating ? deactivateMutation.mutate() : activateMutation.mutate(),
    });
    Alert.alert(confirmation.title, confirmation.message, confirmation.buttons);
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader title="Package details" subtitle={packageItem.name} showBack />
      <PackageMockNotice />
      <View style={styles.profile}>
        <PackageProfileHeader packageItem={packageItem} />
      </View>
      <SectionTitle title="Plan configuration" />
      <PackageMetricsCard packageItem={packageItem} />
      <SectionTitle title="Administrative actions" />
      <PackageActionPanel
        packageItem={packageItem}
        loading={loading}
        onEdit={() =>
          navigation.navigate('PackageEdit', { id: packageItem.id })
        }
        onActivate={confirmStatusChange}
        onDeactivate={confirmStatusChange}
      />
      {mutationError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutationError instanceof Error
            ? mutationError.message
            : 'The package status could not be updated.'}
        </AppText>
      ) : null}
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  profile: { marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
