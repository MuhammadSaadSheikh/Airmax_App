jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
  },
}));

import { reportsService } from '@/services/api';

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
  });

  it('keeps advanced analytics populated for future API integration', async () => {
    const dashboard = await reportsService.getDashboardAnalytics();

    expect(dashboard.revenueTrend.length).toBeGreaterThan(0);
    expect(dashboard.userGrowth.trend.length).toBeGreaterThan(0);
    expect(dashboard.complaintStatus.length).toBeGreaterThan(0);
    expect(dashboard.packageDistribution.length).toBeGreaterThan(0);
    expect(dashboard.networkHealth.availabilityPercentage).toBeGreaterThan(0);
  });
});
