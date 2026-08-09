export type ReportsNumericValue = number | string | null;

export type ReportsAnalyticsResponse = {
  customers: ReportsNumericValue;
  activeConnections: ReportsNumericValue;
  openComplaints: ReportsNumericValue;
  revenue: ReportsNumericValue;
  pending: ReportsNumericValue;
};

export type AnalyticsDataSource = 'api' | 'mock';

export type DashboardSummary = {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  currentMonthRevenue: number;
  pendingPayments: number;
  openComplaints: number;
};

export type DashboardTrendPoint = {
  period: string;
  value: number;
};

export type DashboardBreakdownItem = {
  id: string;
  value: number;
};

export type DashboardAdvancedAnalytics = {
  revenueTrend: DashboardTrendPoint[];
  userGrowth: {
    newUsers: number;
    percentageChange: number;
    trend: DashboardTrendPoint[];
  };
  complaintStatus: DashboardBreakdownItem[];
  packageDistribution: DashboardBreakdownItem[];
};

export type DashboardAnalytics = DashboardAdvancedAnalytics & {
  summary: DashboardSummary;
  summarySource: AnalyticsDataSource;
  advancedAnalyticsSource: AnalyticsDataSource;
  networkHealthSource: AnalyticsDataSource;
  networkHealth: {
    availabilityPercentage: number;
    onlineUsers: number;
    offlineUsers: number;
  };
};
