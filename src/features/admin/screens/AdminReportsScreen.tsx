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
  type ReportMetric,
} from '@/features/admin/components';
import { useReportFilters } from '@/features/admin/hooks/useReportFilters';
import { useAdminNavigation } from '@/navigation';
import { reportsService } from '@/services/api/reports.service';
import { prepareReportCsvExport } from '@/services/api/reports.export';
import { queryKeys } from '@/services/query';
import { colors, money, spacing } from '@/theme';

export default function AdminReportsScreen() {
  const navigation = useAdminNavigation();
  const controls = useReportFilters();
  const [packageId, setPackageId] = useState<string>();
  const [customerStatus, setCustomerStatus] = useState<string>();
  const [complaintCategory, setComplaintCategory] = useState<string>();
  const [technicianAreaId, setTechnicianAreaId] = useState<string>();
  const filters = useMemo(
    () => ({
      ...controls.dateFilters,
      packageId,
      customerStatus,
      complaintCategory,
      technicianAreaId,
    }),
    [
      complaintCategory,
      controls.dateFilters,
      customerStatus,
      packageId,
      technicianAreaId,
    ],
  );
  const query = useQuery({
    queryKey: [...queryKeys.adminReports, 'overview', filters],
    queryFn: () => reportsService.getFoundationAnalytics(filters),
  });
  const data = query.data;
  const exportReport = () => {
    if (!data) return;
    const prepared = prepareReportCsvExport('overview', data);
    Alert.alert(
      'CSV export prepared',
      `${prepared.fileName}\n${prepared.rowCount} rows ready for a future file adapter.`,
    );
  };
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
        action={<ReportExportAction disabled={!data} onPress={exportReport} />}
      />
      <ReportFilterBar {...controls.filterBarProps} />
      {data ? (
        <>
          <ReportFilterChips
            label="Package"
            options={data.filterOptions.packages}
            value={packageId}
            onChange={setPackageId}
          />
          <ReportFilterChips
            label="Customer status"
            options={data.filterOptions.customerStatuses}
            value={customerStatus}
            onChange={setCustomerStatus}
          />
          <ReportFilterChips
            label="Complaint category"
            options={data.filterOptions.complaintCategories}
            value={complaintCategory}
            onChange={setComplaintCategory}
          />
          <ReportFilterChips
            label="Technician area"
            options={data.filterOptions.technicianAreas}
            value={technicianAreaId}
            onChange={setTechnicianAreaId}
          />
        </>
      ) : null}
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
