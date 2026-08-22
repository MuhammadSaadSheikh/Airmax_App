import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import { aggregateReportMetrics } from './reports.aggregator';
import { mapReportsFoundation, mapReportsSummary } from './reports.mapper';
import {
  createReportMetadata,
  systemReportingClock,
  type ReportingClock,
} from './reporting.clock';
import { mockAdvancedAnalytics } from './reports.mock';
import {
  mockReportsRepository,
  type ReportsSnapshotRepository,
} from './reports.mock.repository';
import type {
  AnalyticsDataSource,
  DashboardAdvancedAnalytics,
  DashboardAnalytics,
  ReportFilters,
  ReportMetadata,
  ReportsAnalyticsResponse,
  ReportsFoundationAnalytics,
} from './reports.models';

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function repositoryAnalytics(
  repository: ReportsSnapshotRepository,
): ReportsAnalyticsResponse {
  const snapshot = repository.snapshot();
  const customers = snapshot.customers.filter(
    customer => customer.role === 'CUSTOMER',
  );
  const invoices = snapshot.invoices;
  const complaints = snapshot.complaints;
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
  metadata: ReportMetadata,
): DashboardAnalytics {
  const summary = mapReportsSummary(response);

  return {
    ...metadata,
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

type ReportsServiceDependencies = {
  clock?: ReportingClock;
  repository?: ReportsSnapshotRepository;
};

export function createReportsService(
  dependencies: ReportsServiceDependencies = {},
) {
  const clock = dependencies.clock ?? systemReportingClock;
  const repository = dependencies.repository ?? mockReportsRepository;

  const getFoundationAnalytics = async (
    filters: ReportFilters = {},
  ): Promise<ReportsFoundationAnalytics> => {
    if (environment.useMockApi) {
      await mockDelay();
      const metadata = createReportMetadata(filters, clock, 'mock');
      const metrics = aggregateReportMetrics(repository.snapshot(), metadata);
      return mapReportsFoundation(metrics, metadata);
    }

    const query = new URLSearchParams(
      Object.entries(filters).filter((entry): entry is [string, string] =>
        Boolean(entry[1]),
      ),
    ).toString();
    return apiRequest<ReportsFoundationAnalytics>(
      `/reports/foundation${query ? `?${query}` : ''}`,
    );
  };

  return {
    async getDashboardAnalytics(): Promise<DashboardAnalytics> {
      const metadata = createReportMetadata(
        {},
        clock,
        environment.useMockApi ? 'mock' : 'api',
      );
      if (environment.useMockApi) {
        await mockDelay();
        return buildDashboardAnalytics(
          repositoryAnalytics(repository),
          'mock',
          metadata,
        );
      }

      const response =
        await apiRequest<ReportsAnalyticsResponse>('/reports/analytics');
      return buildDashboardAnalytics(response, 'api', metadata);
    },

    getFoundationAnalytics,
    getReportsAnalytics: getFoundationAnalytics,
  };
}

export const reportsService = createReportsService();
