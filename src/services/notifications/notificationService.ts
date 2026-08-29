import { environment } from '@/config/environment';
import type { NotificationPreference } from './models';
import type { NotificationService } from './notificationService.types';

function loadNotificationService(): NotificationService {
  if (environment.useMockApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./notification.mock.service')
      .mockNotificationService as NotificationService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./notification.live.service')
    .liveNotificationService as NotificationService;
}

export const notificationService = loadNotificationService();

export const getNotifications = (connectionId: string) =>
  notificationService.getNotifications(connectionId);
export const markAsRead = (connectionId: string, id: string) =>
  notificationService.markAsRead(connectionId, id);
export const getPreferences = (connectionId: string) =>
  notificationService.getPreferences(connectionId);
export const updatePreferences = (
  connectionId: string,
  preferences: NotificationPreference,
) => notificationService.updatePreferences(connectionId, preferences);
