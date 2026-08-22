import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auditService } from '@/services/api/audit.service';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';
import {
  attachAdminAuditActor,
  type AdminAuditEventDraft,
} from './audit.events';

export function useAdminAudit() {
  const queryClient = useQueryClient();
  const actor = useAuthStore(state => state.user);

  return useCallback(
    async (event: AdminAuditEventDraft) => {
      const created = await auditService.createAuditEvent(
        attachAdminAuditActor(event, {
          id: actor?.id ?? 'admin-unknown',
          name: actor?.name ?? 'Unknown administrator',
        }),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAudit });
      return created;
    },
    [actor?.id, actor?.name, queryClient],
  );
}
