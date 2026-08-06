import { EmptyState } from '@/components';

export function NotificationEmptyState({
  filtered = false,
}: {
  filtered?: boolean;
}) {
  return (
    <EmptyState
      icon="notifications-off-outline"
      title={filtered ? 'Nothing in this category' : 'You’re all caught up'}
      message={
        filtered
          ? 'New alerts and updates will appear here.'
          : 'Important AIRMAX updates will appear here when they arrive.'
      }
    />
  );
}
