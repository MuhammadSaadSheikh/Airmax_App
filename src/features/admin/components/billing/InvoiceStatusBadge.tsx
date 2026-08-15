import { StatusBadge, type StatusTone } from '@/components';
import type { InvoiceStatus } from '@/services/api/billing.models';

const tones: Record<InvoiceStatus, StatusTone> = {
  generated: 'info',
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'danger',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge label={status} tone={tones[status]} />;
}
