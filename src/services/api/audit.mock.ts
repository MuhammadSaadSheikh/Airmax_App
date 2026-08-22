import type { AuditEventDto } from './audit.models';

export const mockAuditEvents: AuditEventDto[] = [
  {
    id: 'audit-0001',
    actorId: 'admin-mock',
    actorName: 'Danish Admin',
    action: 'PAYMENT_RECORDED',
    entityType: 'PAYMENT',
    entityId: 'payment-1',
    timestamp: '2026-08-20T09:30:00.000Z',
    metadata: { invoiceId: 'invoice-1', method: 'cash', amount: 5000 },
  },
  {
    id: 'audit-0002',
    actorId: 'admin-mock',
    actorName: 'Danish Admin',
    action: 'WORK_ORDER_COMPLETED',
    entityType: 'WORK_ORDER',
    entityId: 'work-order-1',
    timestamp: '2026-08-21T11:15:00.000Z',
    metadata: { complaintId: 'complaint-1', technicianId: 'tech-1' },
  },
];
