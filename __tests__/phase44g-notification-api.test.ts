const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { liveNotificationService } from '../src/services/notifications/notification.live.service';

const dto = {
  id: 'notification-1',
  userId: 'user-1',
  title: 'Account updated',
  message: 'Your AIRMAX account has a new update.',
  data: {
    type: 'billing',
    priority: 'critical',
    actionType: 'pay_bill',
    targetId: 'foreign-invoice',
  },
  readAt: null,
  createdAt: '2026-08-29T08:00:00.000Z',
};

describe('Phase 4.4G notification production contract', () => {
  beforeEach(() => mockApiRequest.mockReset());

  it('loads JWT-owned notifications without interpreting JSON metadata', async () => {
    mockApiRequest.mockResolvedValue([dto]);

    await expect(
      liveNotificationService.getNotifications('ignored-connection'),
    ).resolves.toEqual([
      {
        id: 'notification-1',
        type: 'general',
        title: 'Account updated',
        message: 'Your AIRMAX account has a new update.',
        createdAt: '2026-08-29T08:00:00.000Z',
        isRead: false,
        actionType: 'none',
        priority: 'normal',
      },
    ]);
    expect(mockApiRequest).toHaveBeenCalledWith('/notifications');
  });

  it('marks one notification read through the only approved mutation', async () => {
    mockApiRequest.mockResolvedValue({
      ...dto,
      readAt: '2026-08-29T08:05:00.000Z',
    });

    await expect(
      liveNotificationService.markAsRead('ignored', 'notification/1'),
    ).resolves.toMatchObject({ id: 'notification-1', isRead: true });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/notifications/notification%2F1/read',
      { method: 'PATCH' },
    );
  });

  it('keeps unsupported notification operations disabled', async () => {
    expect(liveNotificationService.supportsMarkAllAsRead).toBe(false);
    expect(liveNotificationService.supportsPreferences).toBe(false);
    await expect(
      liveNotificationService.markAllAsRead('ignored'),
    ).rejects.toThrow('backend contract');
    await expect(
      liveNotificationService.getPreferences('ignored'),
    ).rejects.toThrow('backend contract');
    expect(mockApiRequest).not.toHaveBeenCalled();
  });
});
