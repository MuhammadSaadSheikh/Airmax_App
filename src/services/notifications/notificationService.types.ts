import type { Notification, NotificationPreference } from './models';

export interface NotificationService {
  readonly supportsMarkAllAsRead: boolean;
  readonly supportsPreferences: boolean;
  getNotifications(connectionId: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  markAsRead(
    connectionId: string,
    id: string,
  ): Promise<Notification | undefined>;
  markAllAsRead(connectionId: string): Promise<void>;
  getPreferences(connectionId: string): Promise<NotificationPreference>;
  updatePreferences(
    connectionId: string,
    preferences: NotificationPreference,
  ): Promise<NotificationPreference>;
}
