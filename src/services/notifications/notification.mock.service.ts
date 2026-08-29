import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification, NotificationPreference } from './models';
import type { NotificationService } from './notificationService.types';

const wait = (duration = 280) =>
  new Promise<void>(resolve => setTimeout(resolve, duration));

let notifications: Notification[] = [
  {
    id: 'NTF-260806-01',
    type: 'billing',
    title: 'Your bill is due in 3 days',
    message: 'Your AIRMAX Premium balance of Rs. 3,500 is due on 9 August.',
    createdAt: '2026-08-06T09:15:00.000Z',
    isRead: false,
    actionType: 'pay_bill',
    actionLabel: 'Pay now',
    priority: 'high',
    targetId: 'AMX-2608-1042',
  },
  {
    id: 'NTF-260806-02',
    type: 'network',
    title: 'Maintenance planned tonight',
    message:
      'Brief service interruptions are expected between 2:00 and 2:30 AM.',
    createdAt: '2026-08-06T07:40:00.000Z',
    isRead: false,
    actionType: 'view_details',
    actionLabel: 'View details',
    priority: 'normal',
  },
  {
    id: 'NTF-260805-03',
    type: 'support',
    title: 'Technician assigned',
    message: 'Hamza Khan is working on support ticket AMX-4821.',
    createdAt: '2026-08-05T14:25:00.000Z',
    isRead: false,
    actionType: 'view_support',
    actionLabel: 'Track ticket',
    priority: 'high',
    targetId: 'AMX-4821',
  },
  {
    id: 'NTF-260804-04',
    type: 'offers',
    title: 'Your usage increased 40%',
    message: 'A 200 Mbps plan could keep peak-hour performance consistent.',
    createdAt: '2026-08-04T11:00:00.000Z',
    isRead: true,
    actionType: 'upgrade_plan',
    actionLabel: 'Explore upgrade',
    priority: 'normal',
    targetId: 'ultra',
  },
  {
    id: 'NTF-260802-05',
    type: 'network',
    title: 'Service restored',
    message: 'Connectivity in your area is operating normally again.',
    createdAt: '2026-08-02T18:12:00.000Z',
    isRead: true,
    actionType: 'check_issue',
    actionLabel: 'Check connection',
    priority: 'normal',
  },
  {
    id: 'NTF-260801-06',
    type: 'billing',
    title: 'Invoice available',
    message:
      'Your August invoice is ready. Account details remain masked for privacy.',
    createdAt: '2026-08-01T08:00:00.000Z',
    isRead: true,
    actionType: 'view_details',
    actionLabel: 'View invoice',
    priority: 'normal',
    targetId: 'AMX-2608-1042',
  },
];

const defaults: NotificationPreference = {
  billingEnabled: true,
  networkEnabled: true,
  supportEnabled: true,
  offersEnabled: false,
  packageRecommendationsEnabled: true,
  pushEnabled: true,
};

const preferenceKey = (connectionId: string) =>
  `airmax-notification-preferences:${connectionId}`;
const copyNotification = (item: Notification): Notification => ({ ...item });

export const mockNotificationService: NotificationService = {
  supportsMarkAllAsRead: true,
  supportsPreferences: true,

  async getNotifications() {
    await wait();
    return notifications.map(copyNotification);
  },
  async getNotification(id) {
    await wait(120);
    const item = notifications.find(notification => notification.id === id);
    return item ? copyNotification(item) : undefined;
  },
  async markAsRead(_connectionId, id) {
    await wait(100);
    notifications = notifications.map(item =>
      item.id === id ? { ...item, isRead: true } : item,
    );
    const item = notifications.find(notification => notification.id === id);
    return item ? copyNotification(item) : undefined;
  },
  async markAllAsRead() {
    await wait(120);
    notifications = notifications.map(item => ({ ...item, isRead: true }));
  },
  async getPreferences(connectionId) {
    await wait(120);
    const stored = await AsyncStorage.getItem(preferenceKey(connectionId));
    if (!stored) return { ...defaults };
    try {
      return {
        ...defaults,
        ...(JSON.parse(stored) as Partial<NotificationPreference>),
      };
    } catch {
      return { ...defaults };
    }
  },
  async updatePreferences(connectionId, preferences) {
    await AsyncStorage.setItem(
      preferenceKey(connectionId),
      JSON.stringify(preferences),
    );
    return { ...preferences };
  },
};
