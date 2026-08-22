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

export default function CustomerReportScreen() {
  const controls = useReportFilters();
  const [customerStatus, setCustomerStatus] = useState<string>();
  const filters = useMemo(
    () => ({ ...controls.dateFilters, customerStatus }),
    [controls.dateFilters, customerStatus],
  );
  const query = useQuery({
    queryKey: queryKeys.adminCustomerReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const customers = data?.customers;
  const exportReport = () => {
    if (!data) return;
    const prepared = prepareReportCsvExport('customer', data);
    Alert.alert(
      'CSV export prepared',
      `${prepared.fileName}\n${prepared.rowCount} rows ready for a future file adapter.`,
    );
  };
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
        action={<ReportExportAction disabled={!data} onPress={exportReport} />}
      />
      <ReportFilterBar {...controls.filterBarProps} />
      {data ? (
        <ReportFilterChips
          label="Customer status"
          options={data.filterOptions.customerStatuses}
          value={customerStatus}
          onChange={setCustomerStatus}
        />
      ) : null}
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
