import { StatusBadge, type StatusTone } from '@/components';
import type { PaymentStatus } from '@/services/api/billing.models';

const tones: Record<PaymentStatus, StatusTone> = {
  successful: 'success',
  pending: 'warning',
  failed: 'danger',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge label={status} tone={tones[status]} />;
}
