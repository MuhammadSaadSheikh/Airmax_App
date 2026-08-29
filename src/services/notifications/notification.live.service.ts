import { apiRequest } from '@/services/api/client';
import type { Notification } from './models';
import type { NotificationService } from './notificationService.types';

export type NotificationDto = {
  id: string;
  userId: string;
  title: string;
  message: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
};

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid notification response field: ${field}`);
  }
  return value;
}

export function mapNotificationDto(dto: NotificationDto): Notification {
  return {
    id: requiredString(dto.id, 'id'),
    type: 'general',
    title: requiredString(dto.title, 'title'),
    message: requiredString(dto.message, 'message'),
    createdAt: requiredString(dto.createdAt, 'createdAt'),
    isRead: dto.readAt !== null,
    actionType: 'none',
    priority: 'normal',
  };
}

function unsupported(feature: string): never {
  throw new Error(`${feature} is unavailable until a backend contract exists.`);
}

export const liveNotificationService: NotificationService = {
  supportsMarkAllAsRead: false,
  supportsPreferences: false,

  async getNotifications() {
    const response = await apiRequest<NotificationDto[]>('/notifications');
    return response.map(mapNotificationDto);
  },

  async getNotification(id) {
    const notifications = await this.getNotifications('current-user');
    return notifications.find(notification => notification.id === id);
  },

  async markAsRead(_connectionId, id) {
    return mapNotificationDto(
      await apiRequest<NotificationDto>(
        `/notifications/${encodeURIComponent(id)}/read`,
        { method: 'PATCH' },
      ),
    );
  },

  async markAllAsRead() {
    unsupported('Mark all as read');
  },

  async getPreferences() {
    return unsupported('Notification preferences');
  },

  async updatePreferences() {
    return unsupported('Notification preferences');
  },
};
