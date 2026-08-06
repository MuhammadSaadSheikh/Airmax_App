import { useCallback } from 'react';
import { useCustomerNavigation } from '@/navigation';
import type { NotificationActionType } from '@/services/notifications/models';

export function useNotificationAction() {
  const navigation = useCustomerNavigation();

  return useCallback(
    (action: NotificationActionType, targetId?: string) => {
      switch (action) {
        case 'pay_bill':
          navigation.navigate('BillingCenter');
          break;
        case 'check_issue':
          navigation.navigate('Diagnostics');
          break;
        case 'view_support':
          if (targetId)
            navigation.navigate('ComplaintDetail', { id: targetId });
          else navigation.navigate('ComplaintHistory');
          break;
        case 'renew_plan':
          navigation.navigate('UpgradePackage', {
            id: targetId ?? 'premium',
            action: 'renew',
          });
          break;
        case 'upgrade_plan':
          navigation.navigate('UpgradePackage', {
            id: targetId ?? 'ultra',
            action: 'upgrade',
          });
          break;
        case 'view_details':
        case 'none':
          break;
      }
    },
    [navigation],
  );
}
