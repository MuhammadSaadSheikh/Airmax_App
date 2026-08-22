export type AdminAuditMetadataValue = string | number | boolean | null;

export type AdminAuditEvent = {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  metadata: Record<string, AdminAuditMetadataValue>;
};

export type CreateAdminAuditEventInput = Omit<
  AdminAuditEvent,
  'id' | 'timestamp'
> & {
  id?: string;
  timestamp?: string;
};

function eventId(input: CreateAdminAuditEventInput, timestamp: string): string {
  return [
    'audit',
    input.actorId,
    input.action,
    input.entity,
    input.entityId,
    timestamp,
  ]
    .join(':')
    .replaceAll(/[^a-zA-Z0-9:._-]/g, '-');
}

export function createAdminAuditEvent(
  input: CreateAdminAuditEventInput,
  now: () => string = () => new Date().toISOString(),
): AdminAuditEvent {
  const timestamp = input.timestamp ?? now();
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error('Invalid admin audit timestamp');
  }
  return {
    id: input.id ?? eventId(input, timestamp),
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    timestamp,
    metadata: { ...input.metadata },
  };
}
