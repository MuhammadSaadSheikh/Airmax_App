import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import { mapAuditEvent, mapAuditEvents } from './audit.mapper';
import type {
  AdminAuditEvent,
  AuditEntityType,
  AuditEventDto,
  AuditFilters,
  CreateAuditEventInput,
} from './audit.models';
import {
  mockAuditRepository,
  type AuditRepository,
} from './audit.mock.repository';

export function createAuditService(
  repository: AuditRepository = mockAuditRepository,
) {
  return {
    async getAuditEvents(
      filters: AuditFilters = {},
    ): Promise<AdminAuditEvent[]> {
      if (environment.useMockApi) {
        await mockDelay();
        return mapAuditEvents(repository.list(filters));
      }
      const query = new URLSearchParams(
        Object.entries(filters).filter((entry): entry is [string, string] =>
          Boolean(entry[1]),
        ),
      ).toString();
      return mapAuditEvents(
        await apiRequest<AuditEventDto[]>(
          `/admin/audit${query ? `?${query}` : ''}`,
        ),
      );
    },
    async getEntityHistory(
      entityType: AuditEntityType,
      id: string,
    ): Promise<AdminAuditEvent[]> {
      if (environment.useMockApi) {
        await mockDelay();
        return mapAuditEvents(repository.entityHistory(entityType, id));
      }
      return mapAuditEvents(
        await apiRequest<AuditEventDto[]>(
          `/admin/audit/entity/${entityType}/${encodeURIComponent(id)}`,
        ),
      );
    },
    async createAuditEvent(
      event: CreateAuditEventInput,
    ): Promise<AdminAuditEvent> {
      if (environment.useMockApi) {
        await mockDelay();
        return mapAuditEvent(repository.create(event));
      }
      return mapAuditEvent(
        await apiRequest<AuditEventDto>('/admin/audit', {
          method: 'POST',
          body: JSON.stringify(event),
        }),
      );
    },
    async getRecentActivity(): Promise<AdminAuditEvent[]> {
      if (environment.useMockApi) {
        await mockDelay();
        return mapAuditEvents(repository.recent());
      }
      return mapAuditEvents(
        await apiRequest<AuditEventDto[]>('/admin/audit/recent'),
      );
    },
  };
}

export const auditService = createAuditService();
