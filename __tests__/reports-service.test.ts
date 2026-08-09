jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
  },
}));

import { reportsService } from '@/services/api';
import { mapReportsSummary } from '@/services/api/reports.mapper';

describe('Phase 3A reports service', () => {
  it('returns the supported admin summary metrics', async () => {
    const dashboard = await reportsService.getDashboardAnalytics();

    expect(dashboard.summary).toEqual(
      expect.objectContaining({
        totalUsers: expect.any(Number),
        activeUsers: expect.any(Number),
        offlineUsers: expect.any(Number),
        currentMonthRevenue: expect.any(Number),
        pendingPayments: expect.any(Number),
        openComplaints: expect.any(Number),
      }),
    );
    expect(dashboard.summary.offlineUsers).toBe(
      dashboard.summary.totalUsers - dashboard.summary.activeUsers,
    );
    expect(dashboard.summarySource).toBe('mock');
  });

  it('keeps advanced analytics populated for future API integration', async () => {
    const dashboard = await reportsService.getDashboardAnalytics();

    expect(dashboard.revenueTrend.length).toBeGreaterThan(0);
    expect(dashboard.userGrowth.trend.length).toBeGreaterThan(0);
    expect(dashboard.complaintStatus.length).toBeGreaterThan(0);
    expect(dashboard.packageDistribution.length).toBeGreaterThan(0);
    expect(dashboard.networkHealth.availabilityPercentage).toBeGreaterThan(0);
    expect(dashboard.advancedAnalyticsSource).toBe('mock');
    expect(dashboard.networkHealthSource).toBe('mock');
  });

  it('normalizes invalid and inconsistent API values safely', () => {
    expect(
      mapReportsSummary({
        customers: '10',
        activeConnections: 12,
        openComplaints: null,
        revenue: 'invalid',
        pending: -20,
      }),
    ).toEqual({
      totalUsers: 10,
      activeUsers: 10,
      offlineUsers: 0,
      currentMonthRevenue: 0,
      pendingPayments: 0,
      openComplaints: 0,
    });
  });
});
