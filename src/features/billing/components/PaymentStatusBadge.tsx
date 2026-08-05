import { memo } from 'react';
import { StatusBadge } from '@/components';
import type { BillingStatus, PaymentStatus } from '@/services/billing';

function PaymentStatusBadgeComponent({ status }: { status: BillingStatus | PaymentStatus }) {
  const tone = status === 'paid' || status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'danger';
  return <StatusBadge label={status} tone={tone} />;
}
export const PaymentStatusBadge = memo(PaymentStatusBadgeComponent);
