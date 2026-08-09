import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  DashboardSkeleton,
  ErrorState,
} from '@/components';
import {
  AdminQuickActions,
  DashboardBreakdownCard,
  DashboardMetricGrid,
  NetworkHealthCard,
  RevenueTrendCard,
  UserGrowthCard,
  type AdminQuickAction,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { reportsService } from '@/services/api';
import { queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

const formattedDate = new Intl.DateTimeFormat('en-PK', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

export default function AdminHomeScreen() {
  const navigation = useAdminNavigation();
  const dashboardQuery = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: reportsService.getDashboardAnalytics,
    staleTime: 30_000,
  });

  const quickActions = useMemo<AdminQuickAction[]>(
    () => [
      {
        id: 'payments',
        icon: 'receipt-outline',
        label: 'Payments',
        onPress: () => navigation.navigate('AdminPayments'),
      },
      {
        id: 'technicians',
        icon: 'construct-outline',
        label: 'Technicians',
        onPress: () => navigation.navigate('Technicians'),
      },
      {
        id: 'service-areas',
        icon: 'location-outline',
        label: 'Service areas',
        onPress: () => navigation.navigate('ServiceAreas'),
      },
      {
        id: 'reports',
        icon: 'analytics-outline',
        label: 'Reports',
        onPress: () => navigation.navigate('Reports'),
      },
    ],
    [navigation],
  );

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader title="Command center" subtitle={formattedDate} />

      {dashboardQuery.isPending ? (
        <DashboardSkeleton />
      ) : dashboardQuery.isError ? (
        <ErrorState
          title="Command center unavailable"
          message="We couldn’t load the latest operational snapshot."
          retry={() => void dashboardQuery.refetch()}
        />
      ) : (
        <View style={styles.dashboard}>
          <SectionTitle
            title="Operations overview"
            subtitle="Live customer, billing and support totals"
          />
          <DashboardMetricGrid summary={dashboardQuery.data.summary} />

          <SectionTitle
            title="Revenue trend"
            subtitle="Current totals with mock-ready historical context"
          />
          <RevenueTrendCard
            currentRevenue={dashboardQuery.data.summary.currentMonthRevenue}
            trend={dashboardQuery.data.revenueTrend}
          />

          <SectionTitle
            title="User growth"
            subtitle="Monthly acquisition preview"
          />
          <UserGrowthCard growth={dashboardQuery.data.userGrowth} />

          <SectionTitle
            title="Complaint status"
            subtitle="Current support workload preview"
          />
          <DashboardBreakdownCard
            title="Complaint distribution"
            items={dashboardQuery.data.complaintStatus}
          />

          <SectionTitle
            title="Package distribution"
            subtitle="Subscriber mix preview"
          />
          <DashboardBreakdownCard
            title="Active subscriptions"
            items={dashboardQuery.data.packageDistribution}
          />

          <SectionTitle
            title="Network health"
            subtitle="Availability derived from active users"
          />
          <NetworkHealthCard health={dashboardQuery.data.networkHealth} />

          <SectionTitle
            title="Quick management"
            subtitle="Open core administration tools"
          />
          <AdminQuickActions actions={quickActions} />
        </View>
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
  content: { paddingBottom: spacing.huge },
  dashboard: { gap: spacing.lg },
  sectionHeader: { marginTop: spacing.sm, gap: spacing.xs },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  sectionSubtitle: { ...typography.small, color: colors.muted },
});
