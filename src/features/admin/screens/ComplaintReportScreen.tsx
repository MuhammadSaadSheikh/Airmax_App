import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import {
  ReportBreakdownCard,
  ReportDataSourceNotice,
  ReportExportAction,
  ReportFilterBar,
  ReportFilterChips,
  ReportSkeleton,
  ReportSummaryGrid,
  type ReportMetric,
} from '@/features/admin/components';
import { useReportFilters } from '@/features/admin/hooks/useReportFilters';
import { prepareReportCsvExport } from '@/services/api/reports.export';
import { reportsService } from '@/services/api/reports.service';
import { queryKeys } from '@/services/query';
import { colors, spacing } from '@/theme';

export default function ComplaintReportScreen() {
  const controls = useReportFilters();
  const [complaintCategory, setComplaintCategory] = useState<string>();
  const filters = useMemo(
    () => ({ ...controls.dateFilters, complaintCategory }),
    [complaintCategory, controls.dateFilters],
  );
  const query = useQuery({
    queryKey: queryKeys.adminComplaintReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const complaints = data?.complaints;
  const exportReport = () => {
    if (!data) return;
    const prepared = prepareReportCsvExport('complaint', data);
    Alert.alert(
      'CSV export prepared',
      `${prepared.fileName}\n${prepared.rowCount} rows ready for a future file adapter.`,
    );
  };
  const metrics: ReportMetric[] = complaints
    ? [
        {
          id: 'volume',
          label: 'Complaint volume',
          value: complaints.complaintVolume.toLocaleString('en-PK'),
          icon: 'chatbubbles-outline',
          color: colors.primary,
        },
        {
          id: 'open',
          label: 'Open complaints',
          value: complaints.openComplaints.toLocaleString('en-PK'),
          icon: 'alert-circle-outline',
          color: colors.warning,
        },
        {
          id: 'resolution',
          label: 'Average resolution',
          value:
            complaints.averageResolutionTimeHours === null
              ? '—'
              : `${complaints.averageResolutionTimeHours.toLocaleString('en-PK')} hrs`,
          icon: 'timer-outline',
          color: colors.success,
        },
      ]
    : [];
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Complaint report"
        subtitle="Volume, category and resolution performance"
        showBack
        action={<ReportExportAction disabled={!data} onPress={exportReport} />}
      />
      <ReportFilterBar {...controls.filterBarProps} />
      {data ? (
        <ReportFilterChips
          label="Complaint category"
          options={data.filterOptions.complaintCategories}
          value={complaintCategory}
          onChange={setComplaintCategory}
        />
      ) : null}
      {query.isPending ? (
        <ReportSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Complaint report unavailable"
          message="We couldn’t calculate complaint metrics."
          retry={() => void query.refetch()}
        />
      ) : !data || !complaints || complaints.complaintVolume === 0 ? (
        <EmptyState
          title="No complaints"
          message="No complaints match this reporting period."
          icon="chatbox-outline"
        />
      ) : (
        <>
          <ReportSummaryGrid metrics={metrics} />
          <ReportBreakdownCard
            title="Complaint status distribution"
            items={complaints.statusDistribution}
          />
          <ReportBreakdownCard
            title="Complaint category distribution"
            items={complaints.categoryDistribution}
          />
          <ReportDataSourceNotice metadata={data} />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: spacing.huge } });
