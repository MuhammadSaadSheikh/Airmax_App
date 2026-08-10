import { StatusBadge, type StatusTone } from '@/components';
import type { AdminComplaintStatus } from '@/services/api/complaints.models';

const tones: Record<AdminComplaintStatus, StatusTone> = {
  pending: 'warning',
  assigned: 'info',
  in_progress: 'info',
  resolved: 'success',
  closed: 'success',
};

export function ComplaintStatusBadge({
  status,
}: {
  status: AdminComplaintStatus;
}) {
  return <StatusBadge label={status} tone={tones[status]} />;
}
