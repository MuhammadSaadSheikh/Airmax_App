import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import { mapReportsSummary } from './reports.mapper';
import { mockAdvancedAnalytics } from './reports.mock';
import type {
  AnalyticsDataSource,
  DashboardAdvancedAnalytics,
  DashboardAnalytics,
  ReportsAnalyticsResponse,
} from './reports.models';
import { mockCustomerRepository } from './customers.mock.repository';
import { mockBillingRepository } from './billing.mock.repository';
import { mockComplaintRepository } from './complaints.mock.repository';

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function repositoryAnalytics(): ReportsAnalyticsResponse {
  const customers = mockCustomerRepository
    .list()
    .filter(customer => customer.role === 'CUSTOMER');
  const invoices = mockBillingRepository.listInvoices();
  const complaints = mockComplaintRepository.list();
  return {
    customers: customers.length,
    activeConnections: customers.filter(
      customer => customer.status === 'ACTIVE',
    ).length,
    revenue: invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((total, invoice) => total + numericValue(invoice.amount), 0),
    pending: invoices
      .filter(invoice => invoice.status === 'PENDING')
      .reduce((total, invoice) => total + numericValue(invoice.amount), 0),
    openComplaints: complaints.filter(
      complaint =>
        complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED',
    ).length,
  };
}

function copyAdvancedAnalytics(): DashboardAdvancedAnalytics {
  return {
    revenueTrend: mockAdvancedAnalytics.revenueTrend.map(point => ({
      ...point,
    })),
    userGrowth: {
      ...mockAdvancedAnalytics.userGrowth,
      trend: mockAdvancedAnalytics.userGrowth.trend.map(point => ({
        ...point,
      })),
    },
    complaintStatus: mockAdvancedAnalytics.complaintStatus.map(item => ({
      ...item,
    })),
    packageDistribution: mockAdvancedAnalytics.packageDistribution.map(
      item => ({ ...item }),
    ),
  };
}

function buildDashboardAnalytics(
  response: ReportsAnalyticsResponse,
  summarySource: AnalyticsDataSource,
): DashboardAnalytics {
  const summary = mapReportsSummary(response);

  return {
    summary,
    summarySource,
    advancedAnalyticsSource: 'mock',
    networkHealthSource: summarySource,
    ...copyAdvancedAnalytics(),
    networkHealth: {
      availabilityPercentage:
        summary.totalUsers === 0
          ? 0
          : (summary.activeUsers / summary.totalUsers) * 100,
      onlineUsers: summary.activeUsers,
      offlineUsers: summary.offlineUsers,
    },
  };
}

export const reportsService = {
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    if (environment.useMockApi) {
      await mockDelay();
      return buildDashboardAnalytics(repositoryAnalytics(), 'mock');
    }

    const response =
      await apiRequest<ReportsAnalyticsResponse>('/reports/analytics');
    return buildDashboardAnalytics(response, 'api');
  },
};
