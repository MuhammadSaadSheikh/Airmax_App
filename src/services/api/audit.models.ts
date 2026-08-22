export const auditActions = [
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'CUSTOMER_ACTIVATED',
  'CUSTOMER_SUSPENDED',
  'CUSTOMER_PACKAGE_CHANGED',
  'PACKAGE_CREATED',
  'PACKAGE_UPDATED',
  'PACKAGE_ACTIVATED',
  'PACKAGE_DEACTIVATED',
  'SUBSCRIPTION_ASSIGNED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_SUSPENDED',
  'SUBSCRIPTION_CANCELLED',
  'INVOICE_MARKED_PAID',
  'INVOICE_CANCELLED',
  'PAYMENT_RECORDED',
  'COMPLAINT_TECHNICIAN_ASSIGNED',
  'COMPLAINT_TECHNICIAN_REASSIGNED',
  'COMPLAINT_STATUS_CHANGED',
  'COMPLAINT_REPLIED',
  'TECHNICIAN_STATUS_CHANGED',
  'WORK_ORDER_ACCEPTED',
  'WORK_ORDER_STARTED',
  'WORK_ORDER_COMPLETED',
  'WORK_ORDER_CANCELLED',
] as const;

export type AuditAction = (typeof auditActions)[number];

export const auditEntityTypes = [
  'CUSTOMER',
  'INVOICE',
  'PAYMENT',
  'PACKAGE',
  'SUBSCRIPTION',
  'COMPLAINT',
  'TECHNICIAN',
  'WORK_ORDER',
] as const;

export type AuditEntityType = (typeof auditEntityTypes)[number];

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
