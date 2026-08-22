import type {
  AuditAction,
  AuditEntityType,
  AuditMetadata,
  CreateAuditEventInput,
} from '@/services/api/audit.models';

export type AdminAuditActor = { id: string; name: string };

export type AdminAuditEventDraft = Omit<
  CreateAuditEventInput,
  'actorId' | 'actorName'
>;

type AuditDraftInput = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: AuditMetadata;
};

function event({
  action,
  entityType,
  entityId,
  metadata = {},
}: AuditDraftInput): AdminAuditEventDraft {
  if (!entityId.trim()) throw new Error('Audit entity ID is required');
  return { action, entityType, entityId, metadata: { ...metadata } };
}

export function attachAdminAuditActor(
  draft: AdminAuditEventDraft,
  actor: AdminAuditActor,
): CreateAuditEventInput {
  return {
    ...draft,
    metadata: { ...draft.metadata },
    actorId: actor.id.trim() || 'admin-unknown',
    actorName: actor.name.trim() || 'Unknown administrator',
  };
}

export const adminAuditEvents = {
  customerCreated: (customerId: string, name: string) =>
    event({
      action: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: customerId,
      metadata: { name },
    }),
  customerUpdated: (customerId: string, name: string) =>
    event({
      action: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: customerId,
      metadata: { name },
    }),
  customerStatusChanged: (
    customerId: string,
    status: 'active' | 'suspended',
    reason?: string,
  ) =>
    event({
      action: status === 'active' ? 'CUSTOMER_ACTIVATED' : 'CUSTOMER_SUSPENDED',
      entityType: 'CUSTOMER',
      entityId: customerId,
      metadata: { status, reason: reason ?? null },
    }),
  customerPackageChanged: (
    customerId: string,
    packageId: string,
    subscriptionId: string | null,
  ) =>
    event({
      action: 'CUSTOMER_PACKAGE_CHANGED',
      entityType: 'CUSTOMER',
      entityId: customerId,
      metadata: { packageId, subscriptionId },
    }),
  packageChanged: (
    packageId: string,
    action: 'created' | 'updated' | 'activated' | 'deactivated',
    name: string,
  ) =>
    event({
      action: {
        created: 'PACKAGE_CREATED',
        updated: 'PACKAGE_UPDATED',
        activated: 'PACKAGE_ACTIVATED',
        deactivated: 'PACKAGE_DEACTIVATED',
      }[action] as AuditAction,
      entityType: 'PACKAGE',
      entityId: packageId,
      metadata: { name },
    }),
  subscriptionChanged: (
    subscriptionId: string,
    action: 'assigned' | 'activated' | 'suspended' | 'cancelled',
    customerId: string,
    packageId: string,
  ) =>
    event({
      action: {
        assigned: 'SUBSCRIPTION_ASSIGNED',
        activated: 'SUBSCRIPTION_ACTIVATED',
        suspended: 'SUBSCRIPTION_SUSPENDED',
        cancelled: 'SUBSCRIPTION_CANCELLED',
      }[action] as AuditAction,
      entityType: 'SUBSCRIPTION',
      entityId: subscriptionId,
      metadata: { customerId, packageId },
    }),
  paymentRecorded: (
    paymentId: string,
    invoiceId: string,
    amount: number,
    method: string,
  ) =>
    event({
      action: 'PAYMENT_RECORDED',
      entityType: 'PAYMENT',
      entityId: paymentId,
      metadata: { invoiceId, amount, method },
    }),
  invoiceChanged: (
    invoiceId: string,
    action: 'marked_paid' | 'cancelled',
    metadata: AuditMetadata,
  ) =>
    event({
      action:
        action === 'marked_paid' ? 'INVOICE_MARKED_PAID' : 'INVOICE_CANCELLED',
      entityType: 'INVOICE',
      entityId: invoiceId,
      metadata,
    }),
  complaintAssignment: (
    complaintId: string,
    technicianId: string,
    workOrderId: string,
    previousTechnicianId?: string,
  ) =>
    event({
      action: previousTechnicianId
        ? 'COMPLAINT_TECHNICIAN_REASSIGNED'
        : 'COMPLAINT_TECHNICIAN_ASSIGNED',
      entityType: 'COMPLAINT',
      entityId: complaintId,
      metadata: {
        technicianId,
        workOrderId,
        previousTechnicianId: previousTechnicianId ?? null,
      },
    }),
  complaintStatusChanged: (complaintId: string, status: string) =>
    event({
      action: 'COMPLAINT_STATUS_CHANGED',
      entityType: 'COMPLAINT',
      entityId: complaintId,
      metadata: { status },
    }),
  complaintReplied: (complaintId: string, status: string) =>
    event({
      action: 'COMPLAINT_REPLIED',
      entityType: 'COMPLAINT',
      entityId: complaintId,
      metadata: { status },
    }),
  technicianStatusChanged: (technicianId: string, status: string) =>
    event({
      action: 'TECHNICIAN_STATUS_CHANGED',
      entityType: 'TECHNICIAN',
      entityId: technicianId,
      metadata: { status },
    }),
  workOrderChanged: (
    workOrderId: string,
    action: 'accept' | 'start' | 'complete' | 'cancel',
    complaintId: string,
    technicianId: string,
    status: string,
  ) =>
    event({
      action: {
        accept: 'WORK_ORDER_ACCEPTED',
        start: 'WORK_ORDER_STARTED',
        complete: 'WORK_ORDER_COMPLETED',
        cancel: 'WORK_ORDER_CANCELLED',
      }[action] as AuditAction,
      entityType: 'WORK_ORDER',
      entityId: workOrderId,
      metadata: { complaintId, technicianId, status },
    }),
};
