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
  PackageActionPanel,
  PackageMetricsCard,
  PackageMockNotice,
  PackageProfileHeader,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { packagesService } from '@/services/api';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'PackageDetail'>;

export default function PackageDetailScreen({ navigation, route }: Props) {
  const packageId = route.params.id;
  const queryClient = useQueryClient();
  const packageQuery = useQuery({
    queryKey: queryKeys.adminPackageDetail(packageId),
    queryFn: () => packagesService.getById(packageId),
  });

  const synchronizePackage = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminPackageList,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminPackageDetail(packageId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminCustomerPackageOptions,
      }),
    ]);

  const activateMutation = useMutation({
    mutationFn: () => packagesService.activate(packageId),
    onSuccess: synchronizePackage,
  });
  const deactivateMutation = useMutation({
    mutationFn: () => packagesService.deactivate(packageId),
    onSuccess: synchronizePackage,
  });

  if (packageQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Package details" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
        </View>
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
    Alert.alert(
      deactivating ? 'Deactivate package' : 'Activate package',
      deactivating
        ? 'Existing subscriptions remain active, but this package will no longer be available for new assignments.'
        : 'Make this package available for new admin customer assignments?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: deactivating ? 'Deactivate' : 'Activate',
          style: deactivating ? 'destructive' : 'default',
          onPress: () =>
            deactivating
              ? deactivateMutation.mutate()
              : activateMutation.mutate(),
        },
      ],
    );
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
  loading: { gap: spacing.lg },
  profile: { marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
