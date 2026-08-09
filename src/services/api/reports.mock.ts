import type {
  DashboardAdvancedAnalytics,
  ReportsAnalyticsResponse,
} from './reports.models';

export const mockReportsAnalyticsResponse: ReportsAnalyticsResponse = {
  customers: 2_847,
  activeConnections: 2_691,
  openComplaints: 38,
  revenue: 8_420_000,
  pending: 546_000,
};

export const mockAdvancedAnalytics: DashboardAdvancedAnalytics = {
  revenueTrend: [
    { period: '2026-03', value: 6_780_000 },
    { period: '2026-04', value: 7_120_000 },
    { period: '2026-05', value: 7_460_000 },
    { period: '2026-06', value: 7_720_000 },
    { period: '2026-07', value: 8_010_000 },
    { period: '2026-08', value: 8_420_000 },
  ],
  userGrowth: {
    newUsers: 218,
    percentageChange: 8.5,
    trend: [
      { period: '2026-03', value: 121 },
      { period: '2026-04', value: 148 },
      { period: '2026-05', value: 162 },
      { period: '2026-06', value: 184 },
      { period: '2026-07', value: 201 },
      { period: '2026-08', value: 218 },
    ],
  },
  complaintStatus: [
    { id: 'pending', value: 16 },
    { id: 'in-progress', value: 22 },
    { id: 'resolved', value: 164 },
  ],
  packageDistribution: [
    { id: 'basic', value: 812 },
    { id: 'plus', value: 746 },
    { id: 'premium', value: 921 },
    { id: 'ultra', value: 368 },
  ],
};
