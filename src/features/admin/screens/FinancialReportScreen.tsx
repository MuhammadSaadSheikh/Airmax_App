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
  ReportTrendCard,
  type ReportMetric,
} from '@/features/admin/components';
import {
  reportFiltersForPreset,
  type ReportRangePreset,
} from '@/features/admin/reports.filters';
import { reportsService } from '@/services/api/reports.service';
import { queryKeys } from '@/services/query';
import { colors, money, spacing } from '@/theme';

export default function FinancialReportScreen() {
  const [period, setPeriod] = useState<ReportRangePreset>('current_month');
  const filters = useMemo(() => reportFiltersForPreset(period), [period]);
  const query = useQuery({
    queryKey: queryKeys.adminFinancialReport(filters),
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const financial = data?.financial;
  const metrics: ReportMetric[] = financial
    ? [
        {
          id: 'gross',
          label: 'Gross billed revenue',
          value: money(financial.grossBilledAmount.amount),
          icon: 'receipt-outline',
          color: colors.primary,
        },
        {
          id: 'collected',
          label: 'Collected cash',
          value: money(financial.collectedCash.amount),
          icon: 'cash-outline',
          color: colors.success,
        },
        {
          id: 'pending',
          label: 'Pending receivables',
          value: money(financial.pendingReceivables.amount),
          icon: 'time-outline',
          color: colors.warning,
        },
        {
          id: 'overdue',
          label: 'Overdue amount',
          value: money(financial.overdueAmount.amount),
          icon: 'alert-circle-outline',
          color: colors.danger,
        },
      ]
    : [];
  const empty = financial
    ? financial.grossBilledAmount.amount === 0 &&
      financial.collectedCash.amount === 0 &&
      financial.pendingReceivables.amount === 0 &&
      financial.overdueAmount.amount === 0 &&
      financial.paymentStatusDistribution.length === 0
    : false;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Financial report"
        subtitle="Billing, collections and receivables"
        showBack
      />
      <ReportFilterBar value={period} onChange={setPeriod} />
      {query.isPending ? (
        <ReportSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Financial report unavailable"
          message="We couldn’t calculate financial metrics."
          retry={() => void query.refetch()}
        />
      ) : empty || !data || !financial ? (
        <EmptyState
          title="No financial activity"
          message="No invoices or payments match this reporting period."
          icon="cash-outline"
        />
      ) : (
        <>
          <ReportSummaryGrid metrics={metrics} />
          <ReportTrendCard
            title="Cash position"
            points={[
              { period: 'Billed', value: financial.grossBilledAmount.amount },
              { period: 'Collected', value: financial.collectedCash.amount },
              { period: 'Pending', value: financial.pendingReceivables.amount },
              { period: 'Overdue', value: financial.overdueAmount.amount },
            ]}
            formatValue={money}
          />
          <ReportBreakdownCard
            title="Overdue aging"
            items={financial.overdueAging.map(bucket => ({
              id: bucket.label,
              value: bucket.amount.amount,
            }))}
            formatValue={money}
          />
          <ReportBreakdownCard
            title="Revenue by package"
            items={financial.revenueByPackage}
            formatValue={money}
          />
          <ReportBreakdownCard
            title="Payment status distribution"
            items={financial.paymentStatusDistribution}
          />
          <ReportDataSourceNotice metadata={data} />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: spacing.huge } });
