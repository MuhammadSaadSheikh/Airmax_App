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
import { useCustomerNavigation } from '@/navigation';
import { mockNetworkService } from '@/services/network';
import { notificationService } from '@/services/notifications/notificationService';
import { useCustomerProfile } from '@/services/customer';
import { queryKeys } from '@/services/query/queryKeys';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, radius, spacing, typography } from '@/theme';

export default function CustomerHomeScreen() {
  const navigation = useCustomerNavigation();
  const user = useAuthStore(state => state.user);
  const customerQuery = useCustomerProfile();
  const connectionId =
    customerQuery.data?.connectionId ?? user?.connectionId ?? 'unknown';
  const customerName = customerQuery.data?.name ?? user?.name;

  const dashboardQuery = useQuery({
    queryKey: queryKeys.customerDashboard(connectionId),
    queryFn: () => mockNetworkService.getCustomerDashboard(connectionId),
    staleTime: 30_000,
  });
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(connectionId),
    queryFn: () => notificationService.getNotifications(connectionId),
    staleTime: 30_000,
  });
  const unread =
    notificationsQuery.data?.filter(notification => !notification.isRead)
      .length ?? 0;

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

      {dashboardQuery.isPending ? (
        <DashboardSkeleton />
      ) : dashboardQuery.isError ? (
        <ErrorState
          title="Internet health unavailable"
          message="We couldn’t load your live connection snapshot."
          retry={() => void dashboardQuery.refetch()}
        />
      ) : (
        <Animated.View
          entering={FadeIn.duration(animation.duration.normal)}
          style={styles.dashboard}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Internet Health Center"
            onPress={() => navigation.navigate('InternetHealth')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <InternetHealthCard network={dashboardQuery.data.network} />
          </Pressable>

          <SectionTitle
            title="Network insights"
            subtitle="Your connected equipment"
          />
          <NetworkStatusCard network={dashboardQuery.data.network} />

          <SectionTitle
            title="Speed information"
            subtitle="Latest network snapshot"
          />
          <View style={styles.speedGrid}>
            <SpeedMetricCard
              label="Download"
              value={dashboardQuery.data.speed.download}
              unit="Mbps"
              icon="arrow-down-outline"
            />
            <SpeedMetricCard
              label="Upload"
              value={dashboardQuery.data.speed.upload}
              unit="Mbps"
              icon="arrow-up-outline"
              delay={animation.duration.instant}
            />
            <SpeedMetricCard
              label="Ping"
              value={dashboardQuery.data.speed.ping}
              unit="ms"
              icon="pulse-outline"
              delay={animation.duration.fast}
            />
            <SpeedMetricCard
              label="Jitter"
              value={dashboardQuery.data.speed.jitter}
              unit="ms"
              icon="analytics-outline"
              delay={animation.duration.normal}
            />
          </View>

          <UsageSummaryCard usage={dashboardQuery.data.usage} />

          <SectionTitle
            title="Quick actions"
            subtitle="Everything you need, one tap away"
          />
          <QuickActionGrid actions={quickActions} />

          <SectionTitle
            title="Current package"
            subtitle="Your active internet plan"
          />
          <CurrentPlanCard
            plan={dashboardQuery.data.plan}
            onUpgrade={goToPackages}
            onRenew={goToPayment}
          />

          <SectionTitle
            title="Service alerts"
            subtitle="Updates for your connection"
          />
          {dashboardQuery.data.alerts.length > 0 ? (
            <View style={styles.alerts}>
              {dashboardQuery.data.alerts.map(serviceAlert => (
                <ServiceAlertCard key={serviceAlert.id} alert={serviceAlert} />
              ))}
            </View>
          ) : (
            <EmptyState
              title="All clear"
              message="There are no service alerts for your connection."
              icon="shield-checkmark-outline"
            />
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
