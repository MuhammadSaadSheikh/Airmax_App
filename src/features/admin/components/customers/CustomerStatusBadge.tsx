import { StatusBadge, type StatusTone } from '@/components';
import type {
  AdminCustomerStatus,
  AdminSubscriptionStatus,
} from '@/services/api/customers.models';

type CustomerStatus = AdminCustomerStatus | AdminSubscriptionStatus;

const tones: Record<CustomerStatus, StatusTone> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  disabled: 'danger',
  expired: 'warning',
  cancelled: 'danger',
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <StatusBadge label={status} tone={tones[status]} />;
}
