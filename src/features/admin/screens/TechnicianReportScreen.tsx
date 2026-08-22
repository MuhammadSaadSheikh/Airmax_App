import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import {
  ReportDataSourceNotice,
  ReportFilterBar,
  ReportSkeleton,
  ReportSummaryGrid,
  ReportTrendCard,
  type ReportMetric,
} from '@/features/admin/components';
import {
  reportFiltersForPreset,
  type ReportRangePreset,
} from '@/features/admin/reports.filters';
import { reportsService } from '@/services/api/reports.service';
import { queryKeys } from '@/services/query';
import { colors, spacing } from '@/theme';

export default function TechnicianReportScreen() {
  const [period, setPeriod] = useState<ReportRangePreset>('current_month');
  const filters = useMemo(() => reportFiltersForPreset(period), [period]);
  const query = useQuery({
    queryKey: queryKeys.adminTechnicianReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const technicians = data?.technicians;
  const metrics: ReportMetric[] = technicians
    ? [
        {
          id: 'workload',
          label: 'Active workload',
          value: technicians.activeWorkload.toLocaleString('en-PK'),
          icon: 'briefcase-outline',
          color: colors.primary,
          hint: `${technicians.totalCapacity.toLocaleString('en-PK')} total capacity`,
        },
        {
          id: 'utilization',
          label: 'Utilization',
          value: `${Math.round(technicians.utilizationPercentage)}%`,
          icon: 'speedometer-outline',
          color: colors.purple,
        },
        {
          id: 'completed',
          label: 'Completed jobs',
          value: technicians.completedWorkOrders.toLocaleString('en-PK'),
          icon: 'checkmark-circle-outline',
          color: colors.success,
        },
        {
          id: 'cancelled',
          label: 'Cancelled jobs',
          value: technicians.cancelledWorkOrders.toLocaleString('en-PK'),
          icon: 'close-circle-outline',
          color: colors.danger,
        },
      ]
    : [];
  const empty = technicians
    ? technicians.totalCapacity === 0 &&
      technicians.activeWorkload === 0 &&
      technicians.completedWorkOrders === 0 &&
      technicians.cancelledWorkOrders === 0
    : false;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Technician report"
        subtitle="Workload, utilization and job outcomes"
        showBack
      />
      <ReportFilterBar value={period} onChange={setPeriod} />
      {query.isPending ? (
        <ReportSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Technician report unavailable"
          message="We couldn’t calculate technician metrics."
          retry={() => void query.refetch()}
        />
      ) : empty || !data || !technicians ? (
        <EmptyState
          title="No technician data"
          message="No technician activity is available for this period."
          icon="construct-outline"
        />
      ) : (
        <>
          <ReportSummaryGrid metrics={metrics} />
          <ReportTrendCard
            title="Work order outcomes"
            points={[
              { period: 'Active', value: technicians.activeWorkload },
              { period: 'Completed', value: technicians.completedWorkOrders },
              { period: 'Cancelled', value: technicians.cancelledWorkOrders },
            ]}
          />
          <ReportDataSourceNotice metadata={data} />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: spacing.huge } });
