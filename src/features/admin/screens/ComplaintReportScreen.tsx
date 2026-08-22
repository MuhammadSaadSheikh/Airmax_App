import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import {
  ReportBreakdownCard,
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
import { reportsService } from '@/services/api/reports.service';
import { queryKeys } from '@/services/query';
import { colors, spacing } from '@/theme';

export default function ComplaintReportScreen() {
  const [period, setPeriod] = useState<ReportRangePreset>('current_month');
  const filters = useMemo(() => reportFiltersForPreset(period), [period]);
  const query = useQuery({
    queryKey: queryKeys.adminComplaintReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const complaints = data?.complaints;
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
      />
      <ReportFilterBar value={period} onChange={setPeriod} />
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
