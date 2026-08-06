const mockPreferenceStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) =>
      Promise.resolve(mockPreferenceStore.get(key) ?? null),
    ),
    setItem: jest.fn((key: string, value: string) => {
      mockPreferenceStore.set(key, value);
      return Promise.resolve();
    }),
  },
}));

import { notificationService } from '@/services/notifications/notificationService';
import { personalizationService } from '@/services/notifications/personalizationService';

describe('notification and personalization services', () => {
  const connectionId = 'AMX-NOTIFICATION-TEST';

  beforeEach(() => mockPreferenceStore.clear());

  it('returns categorized actionable notifications', async () => {
    const notifications =
      await notificationService.getNotifications(connectionId);
    expect(notifications.length).toBeGreaterThan(4);
    expect(notifications.some(item => item.type === 'billing')).toBe(true);
    expect(notifications.some(item => item.actionType !== 'none')).toBe(true);
  });

  it('marks a notification as read', async () => {
    const notifications =
      await notificationService.getNotifications(connectionId);
    const unread = notifications.find(item => !item.isRead);
    expect(unread).toBeDefined();

    const updated = await notificationService.markAsRead(
      connectionId,
      unread!.id,
    );
    expect(updated?.isRead).toBe(true);
  });

  it('persists privacy-safe notification preferences', async () => {
    const preferences = await notificationService.getPreferences(connectionId);
    const updated = { ...preferences, offersEnabled: true, pushEnabled: false };
    await notificationService.updatePreferences(connectionId, updated);

    await expect(
      notificationService.getPreferences(connectionId),
    ).resolves.toEqual(updated);
  });

  it('returns recommendations and customer insight', async () => {
    const recommendations =
      await personalizationService.getRecommendations(connectionId);
    const insight =
      await personalizationService.getCustomerInsight(connectionId);
    expect(recommendations[0]?.actionLabel).toBeTruthy();
    expect(insight.packageSuggestion).toContain('200 Mbps');
  });
});
