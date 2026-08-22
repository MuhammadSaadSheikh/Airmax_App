import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import {
  ReportDataSourceNotice,
  ReportFilterBar,
  ReportSkeleton,
  ReportSummaryGrid,
  type ReportMetric,
} from '@/features/admin/components';
import {
  reportFiltersForPreset,
  type ReportRangePreset,
} from '@/features/admin/reports.filters';
import { useAdminNavigation } from '@/navigation';
import { reportsService } from '@/services/api/reports.service';
import { queryKeys } from '@/services/query';
import { colors, money, spacing } from '@/theme';

export default function AdminReportsScreen() {
  const navigation = useAdminNavigation();
  const [period, setPeriod] = useState<ReportRangePreset>('current_month');
  const filters = useMemo(() => reportFiltersForPreset(period), [period]);
  const query = useQuery({
    queryKey: [...queryKeys.adminReports, 'overview', filters],
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const metrics: ReportMetric[] = data
    ? [
        {
          id: 'customers',
          label: 'Customers',
          value: data.customers.totalCustomers.toLocaleString('en-PK'),
          icon: 'people-outline',
          color: colors.primary,
        },
        {
          id: 'subscriptions',
          label: 'Active subscriptions',
          value: data.subscriptions.activeSubscriptions.toLocaleString('en-PK'),
          icon: 'wifi-outline',
          color: colors.success,
        },
        {
          id: 'billed',
          label: 'Billed revenue',
          value: money(data.financial.grossBilledAmount.amount),
          icon: 'receipt-outline',
          color: colors.primary,
        },
        {
          id: 'collected',
          label: 'Collected cash',
          value: money(data.financial.collectedCash.amount),
          icon: 'cash-outline',
          color: colors.success,
        },
        {
          id: 'pending',
          label: 'Pending receivables',
          value: money(data.financial.pendingReceivables.amount),
          icon: 'time-outline',
          color: colors.warning,
        },
        {
          id: 'overdue',
          label: 'Overdue amount',
          value: money(data.financial.overdueAmount.amount),
          icon: 'alert-circle-outline',
          color: colors.danger,
        },
        {
          id: 'complaints',
          label: 'Open complaints',
          value: data.complaints.openComplaints.toLocaleString('en-PK'),
          icon: 'chatbox-ellipses-outline',
          color: colors.danger,
        },
        {
          id: 'technicians',
          label: 'Technician utilization',
          value: `${Math.round(data.technicians.utilizationPercentage)}%`,
          icon: 'construct-outline',
          color: colors.purple,
        },
      ]
    : [];

  const openReport = (metric: ReportMetric) => {
    if (metric.id === 'customers' || metric.id === 'subscriptions')
      navigation.navigate('CustomerReport');
    else if (['billed', 'collected', 'pending', 'overdue'].includes(metric.id))
      navigation.navigate('FinancialReport');
    else if (metric.id === 'complaints') navigation.navigate('ComplaintReport');
    else navigation.navigate('TechnicianReport');
  };
  const empty = data
    ? data.customers.totalCustomers === 0 &&
      data.subscriptions.activeSubscriptions === 0 &&
      data.financial.grossBilledAmount.amount === 0 &&
      data.financial.collectedCash.amount === 0 &&
      data.financial.pendingReceivables.amount === 0 &&
      data.financial.overdueAmount.amount === 0 &&
      data.complaints.complaintVolume === 0 &&
      data.technicians.activeWorkload === 0 &&
      data.technicians.completedWorkOrders === 0 &&
      data.technicians.cancelledWorkOrders === 0
    : false;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Business intelligence"
        subtitle="Read-only operational and financial reporting"
        showBack
      />
      <ReportFilterBar value={period} onChange={setPeriod} />
      {query.isPending ? (
        <ReportSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Reports unavailable"
          message="We couldn’t build the reporting snapshot."
          retry={() => void query.refetch()}
        />
      ) : empty || !data ? (
        <EmptyState
          title="No reporting data"
          message="No business activity is available for this reporting period."
          icon="analytics-outline"
        />
      ) : (
        <>
          <ReportSummaryGrid metrics={metrics} onMetricPress={openReport} />
          <ReportDataSourceNotice metadata={data} />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: spacing.huge } });
