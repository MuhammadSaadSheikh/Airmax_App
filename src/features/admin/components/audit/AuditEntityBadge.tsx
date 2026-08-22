import { StatusBadge } from '@/components';
import type { AuditEntityType } from '@/services/api/audit.models';

export function AuditEntityBadge({
  entityType,
}: {
  entityType: AuditEntityType;
}) {
  return <StatusBadge label={entityType} tone="info" />;
}
