import type {
  AuditEventDto,
  AuditFilters,
  CreateAuditEventInput,
} from './audit.models';
import { mockAuditEvents } from './audit.mock';

function cloneEvent(event: AuditEventDto): AuditEventDto {
  return { ...event, metadata: { ...event.metadata } };
}

function matches(event: AuditEventDto, filters: AuditFilters): boolean {
  if (filters.actorId && event.actorId !== filters.actorId) return false;
  if (filters.action && event.action !== filters.action) return false;
  if (filters.entityType && event.entityType !== filters.entityType)
    return false;
  if (filters.entityId && event.entityId !== filters.entityId) return false;
  if (filters.from && Date.parse(event.timestamp) < Date.parse(filters.from))
    return false;
  if (filters.to && Date.parse(event.timestamp) > Date.parse(filters.to))
    return false;
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const content = [
      event.actorName,
      event.action,
      event.entityType,
      event.entityId,
      ...Object.values(event.metadata).map(String),
    ]
      .join(' ')
      .toLowerCase();
    if (!content.includes(search)) return false;
  }
  return true;
}

export type AuditRepository = {
  list(filters?: AuditFilters): AuditEventDto[];
  create(input: CreateAuditEventInput): AuditEventDto;
  entityHistory(
    entityType: AuditEventDto['entityType'],
    id: string,
  ): AuditEventDto[];
  recent(limit?: number): AuditEventDto[];
  reset(): void;
  deleteEvent(id: string): never;
};

export function createMockAuditRepository(
  seed: AuditEventDto[] = mockAuditEvents,
  now: () => string = () => new Date().toISOString(),
): AuditRepository {
  const initialSeed = seed.map(cloneEvent);
  let events = initialSeed.map(cloneEvent);
  let nextId = events.length + 1;
  const sorted = (items: AuditEventDto[]) =>
    items
      .map(cloneEvent)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp));

  return {
    list: (filters = {}) =>
      sorted(events.filter(event => matches(event, filters))),
    create(input) {
      const timestamp = input.timestamp ?? now();
      if (!Number.isFinite(Date.parse(timestamp)))
        throw new Error('Invalid audit event timestamp');
      const event: AuditEventDto = {
        ...input,
        id: `audit-${String(nextId).padStart(4, '0')}`,
        timestamp,
        metadata: { ...input.metadata },
      };
      nextId += 1;
      events = [...events, event];
      return cloneEvent(event);
    },
    entityHistory: (entityType, id) =>
      sorted(
        events.filter(
          event => event.entityType === entityType && event.entityId === id,
        ),
      ),
    recent: (limit = 10) => sorted(events).slice(0, Math.max(0, limit)),
    reset() {
      events = initialSeed.map(cloneEvent);
      nextId = events.length + 1;
    },
    deleteEvent() {
      throw new Error('Audit events are append-only and cannot be deleted');
    },
  };
}

export const mockAuditRepository = createMockAuditRepository();
