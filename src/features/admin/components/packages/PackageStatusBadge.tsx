import { StatusBadge } from '@/components';
import type { AdminPackageStatus } from '@/services/api/packages.models';

export function PackageStatusBadge({ status }: { status: AdminPackageStatus }) {
  return (
    <StatusBadge
      label={status}
      tone={status === 'active' ? 'success' : 'warning'}
    />
  );
}
