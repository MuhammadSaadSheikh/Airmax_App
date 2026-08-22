export type ReportsNumericValue = number | string | null;

export type ReportsAnalyticsResponse = {
  customers: ReportsNumericValue;
  activeConnections: ReportsNumericValue;
  openComplaints: ReportsNumericValue;
  revenue: ReportsNumericValue;
  pending: ReportsNumericValue;
};

export type AnalyticsDataSource = 'api' | 'mock';

export type ReportDateRange = {
  from: string;
  to: string;
};

export type ReportFilters = {
  from?: string;
  to?: string;
  timezone?: string;
};

export type ReportMetadata = ReportDateRange & {
  timezone: string;
  currency: 'PKR';
  generatedAt: string;
  asOf: string;
  source: AnalyticsDataSource;
};

export type MoneyMetric = {
  amount: number;
  currency: 'PKR';
};

export type ReportTrendPoint = {
  period: string;
  value: number;
};

export type ReportBreakdownItem = {
  id: string;
  value: number;
};

export type AgingBucket = {
  id: string;
  label: string;
  minimumDays: number;
  maximumDays: number | null;
  count: number;
  amount: MoneyMetric;
};

export type CustomerReportMetrics = {
  totalCustomers: number;
  newCustomers: number;
  statusDistribution: ReportBreakdownItem[];
};

export type SubscriptionReportMetrics = {
  activeSubscriptions: number;
  activationCount: number;
  cancellationCount: number;
  packageDistribution: ReportBreakdownItem[];
};

export type FinancialReportMetrics = {
  grossBilledAmount: MoneyMetric;
  collectedCash: MoneyMetric;
  pendingReceivables: MoneyMetric;
  overdueAmount: MoneyMetric;
};

export type ComplaintReportMetrics = {
  openComplaints: number;
  statusDistribution: ReportBreakdownItem[];
  categoryDistribution: ReportBreakdownItem[];
  averageResolutionTimeHours: number | null;
};

export type TechnicianReportMetrics = {
  activeWorkload: number;
  totalCapacity: number;
  utilizationPercentage: number;
  completedWorkOrders: number;
};

export type ReportMetrics = {
  customers: CustomerReportMetrics;
  subscriptions: SubscriptionReportMetrics;
  financial: FinancialReportMetrics;
  complaints: ComplaintReportMetrics;
  technicians: TechnicianReportMetrics;
};

export type ReportsFoundationAnalytics = ReportMetadata & ReportMetrics;

export type DashboardSummary = {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  currentMonthRevenue: number;
  pendingPayments: number;
  openComplaints: number;
};

export type DashboardTrendPoint = ReportTrendPoint;

export type DashboardBreakdownItem = ReportBreakdownItem;

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

export type DashboardAnalytics = DashboardAdvancedAnalytics &
  ReportMetadata & {
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
