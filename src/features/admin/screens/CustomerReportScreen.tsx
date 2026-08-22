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

export default function CustomerReportScreen() {
  const [period, setPeriod] = useState<ReportRangePreset>('current_month');
  const filters = useMemo(() => reportFiltersForPreset(period), [period]);
  const query = useQuery({
    queryKey: queryKeys.adminCustomerReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const customers = data?.customers;
  const metrics: ReportMetric[] = customers
    ? [
        {
          id: 'total',
          label: 'Total customers',
          value: customers.totalCustomers.toLocaleString('en-PK'),
          icon: 'people-outline',
          color: colors.primary,
        },
        {
          id: 'new',
          label: 'New customers',
          value: customers.newCustomers.toLocaleString('en-PK'),
          icon: 'person-add-outline',
          color: colors.success,
        },
      ]
    : [];
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Customer report"
        subtitle="Customer growth and account status"
        showBack
      />
      <ReportFilterBar value={period} onChange={setPeriod} />
      {query.isPending ? (
        <ReportSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Customer report unavailable"
          message="We couldn’t calculate customer metrics."
          retry={() => void query.refetch()}
        />
      ) : !data || !customers || customers.totalCustomers === 0 ? (
        <EmptyState
          title="No customer data"
          message="No customers are available in the reporting snapshot."
          icon="people-outline"
        />
      ) : (
        <>
          <ReportSummaryGrid metrics={metrics} />
          <ReportBreakdownCard
            title="Customer status distribution"
            items={customers.statusDistribution}
          />
          <ReportDataSourceNotice metadata={data} />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: spacing.huge } });
