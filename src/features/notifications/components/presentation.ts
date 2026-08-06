import type { AppIconName } from '@/components';
import type {
  NotificationPriority,
  NotificationType,
} from '@/services/notifications/models';
import { colors } from '@/theme';

export const notificationPresentation: Record<
  NotificationType,
  { icon: AppIconName; color: string; label: string }
> = {
  billing: { icon: 'receipt-outline', color: colors.warning, label: 'Billing' },
  network: { icon: 'wifi-outline', color: colors.primary, label: 'Network' },
  support: { icon: 'headset-outline', color: colors.success, label: 'Support' },
  offers: { icon: 'gift-outline', color: colors.purple, label: 'Offers' },
};

export const priorityColor: Record<NotificationPriority, string> = {
  normal: colors.border,
  high: colors.warning,
  critical: colors.danger,
};
