import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auditService } from '@/services/api/audit.service';
import type { CreateAuditEventInput } from '@/services/api/audit.models';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';

type ActionEvent = Omit<CreateAuditEventInput, 'actorId' | 'actorName'>;

export function useAdminAudit() {
  const queryClient = useQueryClient();
  const actor = useAuthStore(state => state.user);

  return useCallback(
    async (event: ActionEvent) => {
      const created = await auditService.createAuditEvent({
        ...event,
        actorId: actor?.id ?? 'admin-unknown',
        actorName: actor?.name ?? 'Unknown administrator',
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAudit });
      return created;
    },
    [actor?.id, actor?.name, queryClient],
  );
}
