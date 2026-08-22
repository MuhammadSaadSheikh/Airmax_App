import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import {
  ReportDataSourceNotice,
  ReportExportAction,
  ReportFilterBar,
  ReportFilterChips,
  ReportSkeleton,
  ReportSummaryGrid,
  ReportTrendCard,
  type ReportMetric,
} from '@/features/admin/components';
import { useReportFilters } from '@/features/admin/hooks/useReportFilters';
import { prepareReportCsvExport } from '@/services/api/reports.export';
import { reportsService } from '@/services/api/reports.service';
import { queryKeys } from '@/services/query';
import { colors, spacing } from '@/theme';

export default function TechnicianReportScreen() {
  const controls = useReportFilters();
  const [technicianAreaId, setTechnicianAreaId] = useState<string>();
  const filters = useMemo(
    () => ({ ...controls.dateFilters, technicianAreaId }),
    [controls.dateFilters, technicianAreaId],
  );
  const query = useQuery({
    queryKey: queryKeys.adminTechnicianReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const technicians = data?.technicians;
  const exportReport = () => {
    if (!data) return;
    const prepared = prepareReportCsvExport('technician', data);
    Alert.alert(
      'CSV export prepared',
      `${prepared.fileName}\n${prepared.rowCount} rows ready for a future file adapter.`,
    );
  };
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
        action={<ReportExportAction disabled={!data} onPress={exportReport} />}
      />
      <ReportFilterBar {...controls.filterBarProps} />
      {data ? (
        <ReportFilterChips
          label="Technician area"
          options={data.filterOptions.technicianAreas}
          value={technicianAreaId}
          onChange={setTechnicianAreaId}
        />
      ) : null}
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
