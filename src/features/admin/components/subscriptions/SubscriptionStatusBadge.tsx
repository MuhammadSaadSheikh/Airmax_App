import { StatusBadge, type StatusTone } from '@/components';
import type { SubscriptionStatus } from '@/services/api/subscriptions.models';

const tones: Record<SubscriptionStatus, StatusTone> = {
  pending: 'warning',
  active: 'success',
  suspended: 'danger',
  expired: 'warning',
  cancelled: 'danger',
};

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  return <StatusBadge label={status} tone={tones[status]} />;
}
