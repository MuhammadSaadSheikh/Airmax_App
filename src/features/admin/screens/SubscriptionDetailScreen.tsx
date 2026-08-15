import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Row,
  SkeletonCard,
  Surface,
} from '@/components';
import { environment } from '@/config/environment';
import {
  SubscriptionActionPanel,
  SubscriptionMockNotice,
  SubscriptionPackageCard,
  SubscriptionProfileCard,
  SubscriptionStatusBadge,
  SubscriptionTimeline,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { subscriptionsService } from '@/services/api';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'SubscriptionDetail'>;

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export default function SubscriptionDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const subscriptionId = route.params.id;
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.adminSubscriptionDetail(subscriptionId),
    queryFn: () => subscriptionsService.getSubscriptionById(subscriptionId),
  });

  const synchronizeSubscription = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSubscriptions }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminCustomerSubscriptions(
          subscriptionQuery.data?.customer.id ?? '',
        ),
      }),
    ]);
  };

  const activateMutation = useMutation({
    mutationFn: () => subscriptionsService.activateSubscription(subscriptionId),
    onSuccess: synchronizeSubscription,
  });
  const suspendMutation = useMutation({
    mutationFn: () => subscriptionsService.suspendSubscription(subscriptionId),
    onSuccess: synchronizeSubscription,
  });
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsService.cancelSubscription(subscriptionId),
    onSuccess: synchronizeSubscription,
  });

  const confirm = (
    title: string,
    message: string,
    action: 'activate' | 'suspend' | 'cancel',
  ) => {
    Alert.alert(title, message, [
      { text: 'Back', style: 'cancel' },
      {
        text: action === 'cancel' ? 'Cancel subscription' : title,
        style:
          action === 'cancel' || action === 'suspend'
            ? 'destructive'
            : 'default',
        onPress: () => {
          if (action === 'activate') activateMutation.mutate();
          if (action === 'suspend') suspendMutation.mutate();
          if (action === 'cancel') cancelMutation.mutate();
        },
      },
    ]);
  };

  if (subscriptionQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Subscription details" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </View>
      </AppScreen>
    );
  }

  if (subscriptionQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Subscription details" showBack />
        <ErrorState
          title="Subscription unavailable"
          message="This subscription record could not be loaded."
          retry={() => void subscriptionQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const subscription = subscriptionQuery.data;
  const mutationError =
    activateMutation.error ?? suspendMutation.error ?? cancelMutation.error;
  const loading =
    activateMutation.isPending ||
    suspendMutation.isPending ||
    cancelMutation.isPending;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Subscription details"
        subtitle={subscription.id}
        showBack
      />
      {environment.useMockApi ? <SubscriptionMockNotice /> : null}

      <View style={styles.statusCard}>
        <Surface>
          <SubscriptionStatusBadge status={subscription.status} />
          <View style={styles.dates}>
            <Row
              icon="play-circle-outline"
              title="Start date"
              subtitle={displayDate(subscription.startsAt)}
            />
            <Row
              icon="calendar-outline"
              title="Expiry date"
              subtitle={displayDate(subscription.expiresAt)}
            />
          </View>
        </Surface>
      </View>

      <SectionTitle title="Customer information" />
      <SubscriptionProfileCard customer={subscription.customer} />

      <SectionTitle title="Current package" />
      <SubscriptionPackageCard packageItem={subscription.package} />

      <SectionTitle title="Lifecycle actions" />
      <SubscriptionActionPanel
        status={subscription.status}
        loading={loading}
        onActivate={() =>
          confirm('Activate', 'Activate this subscription?', 'activate')
        }
        onSuspend={() =>
          confirm('Suspend', 'Suspend this active subscription?', 'suspend')
        }
        onCancel={() =>
          confirm('Cancel', 'Cancel this subscription permanently?', 'cancel')
        }
        onChangePackage={() =>
          navigation.navigate('CustomerPackageChange', {
            id: subscription.customer.id,
          })
        }
      />

      {mutationError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutationError instanceof Error
            ? mutationError.message
            : 'The subscription action could not be completed.'}
        </AppText>
      ) : null}

      <SectionTitle title="Subscription history" />
      <SubscriptionTimeline history={subscription.history} />
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  loading: { gap: spacing.lg },
  statusCard: { marginTop: spacing.lg },
  dates: { gap: spacing.md, marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
