import { EmptyState } from '@/components';

export function AuditEmptyState() {
  return (
    <EmptyState
      title="No audit events"
      message="No administrative activity matches these filters."
      icon="shield-checkmark-outline"
    />
  );
}
