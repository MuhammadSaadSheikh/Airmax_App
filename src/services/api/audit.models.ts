export type AuditAction =
  | 'INVOICE_CANCELLED'
  | 'PAYMENT_RECORDED'
  | 'PACKAGE_DEACTIVATED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'COMPLAINT_TECHNICIAN_REASSIGNED'
  | 'WORK_ORDER_ACCEPTED'
  | 'WORK_ORDER_STARTED'
  | 'WORK_ORDER_COMPLETED'
  | 'WORK_ORDER_CANCELLED';

export type AuditEntityType =
  | 'INVOICE'
  | 'PAYMENT'
  | 'PACKAGE'
  | 'SUBSCRIPTION'
  | 'COMPLAINT'
  | 'WORK_ORDER';

export type AuditMetadataValue = string | number | boolean | null;
export type AuditMetadata = Record<string, AuditMetadataValue>;

export type AuditEventDto = {
  id: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  timestamp: string;
  metadata: AuditMetadata;
};

export type AdminAuditEvent = AuditEventDto;

export type AuditFilters = {
  actorId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  from?: string;
  to?: string;
  search?: string;
};

export type CreateAuditEventInput = Omit<AuditEventDto, 'id' | 'timestamp'> & {
  timestamp?: string;
};

export function createAdminAuditEvent(
  input: CreateAuditEventInput & { id?: string },
  now: () => string = () => new Date().toISOString(),
): AdminAuditEvent {
  const timestamp = input.timestamp ?? now();
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error('Invalid admin audit timestamp');
  }
  const id =
    input.id ??
    [
      'audit',
      input.actorId,
      input.action,
      input.entityType,
      input.entityId,
      timestamp,
    ]
      .join(':')
      .replaceAll(/[^a-zA-Z0-9:._-]/g, '-');
  return { ...input, id, timestamp, metadata: { ...input.metadata } };
}
