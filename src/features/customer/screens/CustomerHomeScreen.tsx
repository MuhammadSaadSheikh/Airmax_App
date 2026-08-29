import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  DashboardSkeleton,
  EmptyState,
  ErrorState,
} from '@/components';
import {
  CurrentPlanCard,
  InternetHealthCard,
  NetworkStatusCard,
  QuickActionGrid,
  ServiceAlertCard,
  SpeedMetricCard,
  UsageSummaryCard,
  type QuickAction,
} from '@/features/customer/components';
import { environment } from '@/config/environment';
import { useCustomerNavigation } from '@/navigation';
import { useCustomerInvoices } from '@/services/billing';
import { useCustomerProfile } from '@/services/customer';
import { dashboardAlerts, dashboardPlan } from '@/services/dashboard';
import { mockNetworkService } from '@/services/network';
import { notificationService } from '@/services/notifications/notificationService';
import { mapCurrentPackage } from '@/services/package';
import { queryKeys } from '@/services/query/queryKeys';
import { useCustomerSubscriptions } from '@/services/subscription';
import { useCustomerComplaints } from '@/services/support';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, radius, spacing, typography } from '@/theme';

export default function CustomerHomeScreen() {
  const navigation = useCustomerNavigation();
  const user = useAuthStore(state => state.user);
  const customerQuery = useCustomerProfile();
  const connectionId =
    customerQuery.data?.connectionId ?? user?.connectionId ?? 'unknown';
  const customerName = customerQuery.data?.name ?? user?.name;
  const customerId = customerQuery.data?.id;
  const subscriptionsQuery = useCustomerSubscriptions(customerId);
  const invoicesQuery = useCustomerInvoices(customerId);
  const complaintsQuery = useCustomerComplaints(customerId);

  const networkQuery = useQuery({
    queryKey: queryKeys.customerDashboard(connectionId),
    queryFn: () => mockNetworkService.getCustomerDashboard(connectionId),
    enabled: environment.useMockApi && Boolean(customerQuery.data),
    staleTime: 30_000,
  });
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(user?.id ?? connectionId),
    queryFn: () => notificationService.getNotifications(connectionId),
    staleTime: 30_000,
  });
  const unread =
    notificationsQuery.data?.filter(notification => !notification.isRead)
      .length ?? 0;
  const currentPackage = useMemo(
    () => mapCurrentPackage(subscriptionsQuery.data ?? []),
    [subscriptionsQuery.data],
  );
  const plan = useMemo(() => dashboardPlan(currentPackage), [currentPackage]);
  const alerts = useMemo(
    () => dashboardAlerts(invoicesQuery.data ?? [], complaintsQuery.data ?? []),
    [complaintsQuery.data, invoicesQuery.data],
  );
  const businessPending =
    customerQuery.isPending ||
    subscriptionsQuery.isPending ||
    invoicesQuery.isPending ||
    complaintsQuery.isPending;
  const businessError =
    customerQuery.isError ||
    subscriptionsQuery.isError ||
    invoicesQuery.isError ||
    complaintsQuery.isError;

  const runSpeedTest = useCallback(
    () => navigation.navigate('SpeedTest'),
    [navigation],
  );

  const goToPackages = useCallback(
    () => navigation.navigate('CustomerTabs', { screen: 'Packages' }),
    [navigation],
  );
  const goToPayment = useCallback(
    () => navigation.navigate('Payment'),
    [navigation],
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'speed-test',
        label: 'Speed test',
        icon: 'speedometer-outline',
        onPress: runSpeedTest,
      },
      {
        id: 'pay-bill',
        label: 'Pay bill',
        icon: 'card-outline',
        onPress: goToPayment,
      },
      {
        id: 'complaint',
        label: 'Complaint',
        icon: 'chatbox-ellipses-outline',
        onPress: () => navigation.navigate('NewComplaint'),
      },
      {
        id: 'packages',
        label: 'Packages',
        icon: 'cube-outline',
        onPress: goToPackages,
      },
      {
        id: 'support',
        label: 'Support',
        icon: 'headset-outline',
        onPress: () =>
          navigation.navigate('CustomerTabs', { screen: 'Support' }),
      },
    ],
    [goToPackages, goToPayment, navigation, runSpeedTest],
  );

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <AppHeader
        title={`Hello, ${customerName?.split(' ')[0] ?? 'Customer'}`}
        subtitle={`Connection ${connectionId}`}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`}
            onPress={() => navigation.navigate('Notifications')}
            style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
          >
            <AppIcon
              name="notifications-outline"
              color={colors.text}
              size={23}
            />
            {unread > 0 ? (
              <View style={styles.count}>
                <AppText style={styles.countText}>{unread}</AppText>
              </View>
            ) : null}
          </Pressable>
        }
      />

      {customerQuery.isPending ? (
        <DashboardSkeleton />
      ) : customerQuery.isError || !customerQuery.data ? (
        <ErrorState
          title="Customer profile unavailable"
          message="We couldn’t verify your customer account."
          retry={() => void customerQuery.refetch()}
        />
      ) : (
        <Animated.View
          entering={FadeIn.duration(animation.duration.normal)}
          style={styles.dashboard}
        >
          {environment.useMockApi ? (
            networkQuery.isPending ? (
              <DashboardSkeleton />
            ) : networkQuery.isError || !networkQuery.data ? (
              <ErrorState
                title="Internet health unavailable"
                message="We couldn’t load the mock connection snapshot."
                retry={() => void networkQuery.refetch()}
              />
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open Internet Health Center"
                  onPress={() => navigation.navigate('InternetHealth')}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <InternetHealthCard network={networkQuery.data.network} />
                </Pressable>
                <SectionTitle
                  title="Network insights"
                  subtitle="Mock connected equipment snapshot"
                />
                <NetworkStatusCard network={networkQuery.data.network} />
                <SectionTitle
                  title="Speed information"
                  subtitle="Mock network snapshot"
                />
                <View style={styles.speedGrid}>
                  <SpeedMetricCard
                    label="Download"
                    value={networkQuery.data.speed.download}
                    unit="Mbps"
                    icon="arrow-down-outline"
                  />
                  <SpeedMetricCard
                    label="Upload"
                    value={networkQuery.data.speed.upload}
                    unit="Mbps"
                    icon="arrow-up-outline"
                    delay={animation.duration.instant}
                  />
                  <SpeedMetricCard
                    label="Ping"
                    value={networkQuery.data.speed.ping}
                    unit="ms"
                    icon="pulse-outline"
                    delay={animation.duration.fast}
                  />
                  <SpeedMetricCard
                    label="Jitter"
                    value={networkQuery.data.speed.jitter}
                    unit="ms"
                    icon="analytics-outline"
                    delay={animation.duration.normal}
                  />
                </View>
                <UsageSummaryCard usage={networkQuery.data.usage} />
              </>
            )
          ) : (
            <EmptyState
              title="Network telemetry unavailable"
              message="Live network health, usage, speed and diagnostics will appear after a secure backend monitoring contract is available."
              icon="cloud-offline-outline"
            />
          )}

          <SectionTitle
            title="Quick actions"
            subtitle="Everything you need, one tap away"
          />
          <QuickActionGrid actions={quickActions} />

          {businessPending ? (
            <DashboardSkeleton />
          ) : businessError ? (
            <ErrorState
              title="Account summary unavailable"
              message="We couldn’t load your package, billing or complaint summary."
              retry={() => {
                void subscriptionsQuery.refetch();
                void invoicesQuery.refetch();
                void complaintsQuery.refetch();
              }}
            />
          ) : (
            <>
              <SectionTitle
                title="Current package"
                subtitle="Your production subscription"
              />
              {plan ? (
                <CurrentPlanCard
                  plan={plan}
                  onUpgrade={goToPackages}
                  onRenew={goToPayment}
                />
              ) : (
                <EmptyState
                  title="No current package"
                  message="No active or pending subscription is available."
                  icon="cube-outline"
                />
              )}
              <SectionTitle
                title="Account alerts"
                subtitle="Production billing and complaint updates"
              />
              {alerts.length > 0 ? (
                <View style={styles.alerts}>
                  {alerts.map(serviceAlert => (
                    <ServiceAlertCard
                      key={serviceAlert.id}
                      alert={serviceAlert}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="All clear"
                  message="There are no payable bills or open complaints."
                  icon="shield-checkmark-outline"
                />
              )}
            </>
          )}
        </Animated.View>
      )}
    </AppScreen>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText style={styles.sectionSubtitle}>{subtitle}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: spacing.huge },
  dashboard: { gap: spacing.lg },
  bell: {
    width: spacing.huge + spacing.md,
    height: spacing.huge + spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: animation.opacity.pressed },
  count: {
    position: 'absolute',
    right: spacing.sm - 1,
    top: spacing.sm - 2,
    minWidth: spacing.lg,
    height: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: colors.white,
    fontFamily: typography.sectionTitle.fontFamily,
    fontSize: typography.small.fontSize - 2,
  },
  sectionHeader: { marginTop: spacing.sm, gap: spacing.xs },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  sectionSubtitle: { ...typography.small, color: colors.muted },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  alerts: { gap: spacing.md },
});
