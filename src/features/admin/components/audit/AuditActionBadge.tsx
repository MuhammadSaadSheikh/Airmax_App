import { StatusBadge, type StatusTone } from '@/components';
import type { AuditAction } from '@/services/api/audit.models';

export function AuditActionBadge({ action }: { action: AuditAction }) {
  const tone: StatusTone = action.includes('CANCELLED')
    ? 'danger'
    : action.includes('COMPLETED') || action.includes('RECORDED')
      ? 'success'
      : action.includes('SUSPENDED') || action.includes('DEACTIVATED')
        ? 'warning'
        : 'info';
  return <StatusBadge label={action} tone={tone} />;
}
