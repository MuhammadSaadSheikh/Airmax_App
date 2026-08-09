import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';

type ReportsAnalyticsResponse = {
  customers: number;
  activeConnections: number;
  openComplaints: number;
  revenue: number | string;
  pending: number | string;
};

export type DashboardSummary = {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  currentMonthRevenue: number;
  pendingPayments: number;
  openComplaints: number;
};

export type DashboardTrendPoint = {
  label: string;
  value: number;
};

export type DashboardBreakdownItem = {
  id: string;
  label: string;
  value: number;
};

export type DashboardAnalytics = {
  summary: DashboardSummary;
  revenueTrend: DashboardTrendPoint[];
  userGrowth: {
    newUsers: number;
    percentageChange: number;
    trend: DashboardTrendPoint[];
  };
  complaintStatus: DashboardBreakdownItem[];
  packageDistribution: DashboardBreakdownItem[];
  networkHealth: {
    availabilityPercentage: number;
    onlineUsers: number;
    offlineUsers: number;
  };
};

const mockResponse: ReportsAnalyticsResponse = {
  customers: 2_847,
  activeConnections: 2_691,
  openComplaints: 38,
  revenue: 8_420_000,
  pending: 546_000,
};

const revenueTrend: DashboardTrendPoint[] = [
  { label: 'Mar', value: 6_780_000 },
  { label: 'Apr', value: 7_120_000 },
  { label: 'May', value: 7_460_000 },
  { label: 'Jun', value: 7_720_000 },
  { label: 'Jul', value: 8_010_000 },
  { label: 'Aug', value: 8_420_000 },
];

const userGrowthTrend: DashboardTrendPoint[] = [
  { label: 'Mar', value: 121 },
  { label: 'Apr', value: 148 },
  { label: 'May', value: 162 },
  { label: 'Jun', value: 184 },
  { label: 'Jul', value: 201 },
  { label: 'Aug', value: 218 },
];

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDashboardAnalytics(
  response: ReportsAnalyticsResponse,
): DashboardAnalytics {
  const totalUsers = Math.max(0, response.customers);
  const activeUsers = Math.min(
    totalUsers,
    Math.max(0, response.activeConnections),
  );
  const offlineUsers = Math.max(totalUsers - activeUsers, 0);

  return {
    summary: {
      totalUsers,
      activeUsers,
      offlineUsers,
      currentMonthRevenue: numericValue(response.revenue),
      pendingPayments: numericValue(response.pending),
      openComplaints: Math.max(0, response.openComplaints),
    },
    revenueTrend: revenueTrend.map(point => ({ ...point })),
    userGrowth: {
      newUsers: userGrowthTrend.at(-1)?.value ?? 0,
      percentageChange: 8.5,
      trend: userGrowthTrend.map(point => ({ ...point })),
    },
    complaintStatus: [
      { id: 'pending', label: 'Pending', value: 16 },
      { id: 'in-progress', label: 'In progress', value: 22 },
      { id: 'resolved', label: 'Resolved', value: 164 },
    ],
    packageDistribution: [
      { id: 'basic', label: 'Basic', value: 812 },
      { id: 'plus', label: 'Air Plus', value: 746 },
      { id: 'premium', label: 'Premium', value: 921 },
      { id: 'ultra', label: 'Ultra Fiber', value: 368 },
    ],
    networkHealth: {
      availabilityPercentage:
        totalUsers === 0 ? 0 : (activeUsers / totalUsers) * 100,
      onlineUsers: activeUsers,
      offlineUsers,
    },
  };
}

export const reportsService = {
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    if (environment.useMockApi) {
      await mockDelay();
      return mapDashboardAnalytics(mockResponse);
    }

    const response =
      await apiRequest<ReportsAnalyticsResponse>('/reports/analytics');
    return mapDashboardAnalytics(response);
  },
};
