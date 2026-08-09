import type {
  DashboardSummary,
  ReportsAnalyticsResponse,
  ReportsNumericValue,
} from './reports.models';

function numericValue(value: ReportsNumericValue): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
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
