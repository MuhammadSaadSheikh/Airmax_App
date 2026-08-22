import type {
  DashboardSummary,
  ReportMetadata,
  ReportMetrics,
  ReportFilterOptions,
  ReportsFoundationAnalytics,
  ReportsAnalyticsResponse,
  ReportsNumericValue,
} from './reports.models';

function numericValue(value: ReportsNumericValue): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function mapReportsFoundation(
  metrics: ReportMetrics,
  metadata: ReportMetadata,
  filterOptions: ReportFilterOptions = {
    packages: [],
    customerStatuses: [],
    complaintCategories: [],
    technicianAreas: [],
  },
): ReportsFoundationAnalytics {
  return {
    ...metadata,
    filterOptions: {
      packages: filterOptions.packages.map(item => ({ ...item })),
      customerStatuses: filterOptions.customerStatuses.map(item => ({
        ...item,
      })),
      complaintCategories: filterOptions.complaintCategories.map(item => ({
        ...item,
      })),
      technicianAreas: filterOptions.technicianAreas.map(item => ({ ...item })),
    },
    customers: {
      totalCustomers: nonNegative(metrics.customers.totalCustomers),
      newCustomers: nonNegative(metrics.customers.newCustomers),
      statusDistribution: metrics.customers.statusDistribution.map(item => ({
        id: item.id,
        value: nonNegative(item.value),
      })),
    },
    subscriptions: {
      activeSubscriptions: nonNegative(
        metrics.subscriptions.activeSubscriptions,
      ),
      activationCount: nonNegative(metrics.subscriptions.activationCount),
      cancellationCount: nonNegative(metrics.subscriptions.cancellationCount),
      packageDistribution: metrics.subscriptions.packageDistribution.map(
        item => ({ id: item.id, value: nonNegative(item.value) }),
      ),
    },
    financial: {
      grossBilledAmount: {
        amount: nonNegative(metrics.financial.grossBilledAmount.amount),
        currency: metadata.currency,
      },
      collectedCash: {
        amount: nonNegative(metrics.financial.collectedCash.amount),
        currency: metadata.currency,
      },
      pendingReceivables: {
        amount: nonNegative(metrics.financial.pendingReceivables.amount),
        currency: metadata.currency,
      },
      overdueAmount: {
        amount: nonNegative(metrics.financial.overdueAmount.amount),
        currency: metadata.currency,
      },
      overdueAging: metrics.financial.overdueAging.map(bucket => ({
        ...bucket,
        count: nonNegative(bucket.count),
        amount: {
          amount: nonNegative(bucket.amount.amount),
          currency: metadata.currency,
        },
      })),
      revenueByPackage: metrics.financial.revenueByPackage.map(item => ({
        id: item.id,
        value: nonNegative(item.value),
      })),
      paymentStatusDistribution:
        metrics.financial.paymentStatusDistribution.map(item => ({
          id: item.id,
          value: nonNegative(item.value),
        })),
    },
    complaints: {
      complaintVolume: nonNegative(metrics.complaints.complaintVolume),
      openComplaints: nonNegative(metrics.complaints.openComplaints),
      statusDistribution: metrics.complaints.statusDistribution.map(item => ({
        id: item.id,
        value: nonNegative(item.value),
      })),
      categoryDistribution: metrics.complaints.categoryDistribution.map(
        item => ({ id: item.id, value: nonNegative(item.value) }),
      ),
      averageResolutionTimeHours:
        metrics.complaints.averageResolutionTimeHours === null
          ? null
          : nonNegative(metrics.complaints.averageResolutionTimeHours),
    },
    technicians: {
      activeWorkload: nonNegative(metrics.technicians.activeWorkload),
      totalCapacity: nonNegative(metrics.technicians.totalCapacity),
      utilizationPercentage: Math.min(
        100,
        nonNegative(metrics.technicians.utilizationPercentage),
      ),
      completedWorkOrders: nonNegative(metrics.technicians.completedWorkOrders),
      cancelledWorkOrders: nonNegative(metrics.technicians.cancelledWorkOrders),
    },
  };
}

export function mapReportsSummary(
  response: ReportsAnalyticsResponse,
): DashboardSummary {
  const totalUsers = numericValue(response.customers);
  const activeUsers = Math.min(
    totalUsers,
    numericValue(response.activeConnections),
  );

  return {
    totalUsers,
    activeUsers,
    offlineUsers: Math.max(totalUsers - activeUsers, 0),
    currentMonthRevenue: numericValue(response.revenue),
    pendingPayments: numericValue(response.pending),
    openComplaints: numericValue(response.openComplaints),
  };
}
