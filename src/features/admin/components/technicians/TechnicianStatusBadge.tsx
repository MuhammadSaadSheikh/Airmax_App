import { StatusBadge, type StatusTone } from '@/components';
import type { TechnicianStatus } from '@/services/api/technicians.models';

const tones: Record<TechnicianStatus, StatusTone> = {
  AVAILABLE: 'success',
  BUSY: 'warning',
  OFFLINE: 'danger',
  ON_LEAVE: 'info',
};

export function TechnicianStatusBadge({
  status,
}: {
  status: TechnicianStatus;
}) {
  return <StatusBadge label={status} tone={tones[status]} />;
}
