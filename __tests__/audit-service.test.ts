jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import type {
  AuditEventDto,
  CreateAuditEventInput,
} from '@/services/api/audit.models';
import { createMockAuditRepository } from '@/services/api/audit.mock.repository';
import { createAuditService } from '@/services/api/audit.service';
import { mockBillingRepository } from '@/services/api/billing.mock.repository';

const seed: AuditEventDto[] = [
  {
    id: 'audit-0001',
    actorId: 'admin-1',
    actorName: 'Admin One',
    action: 'PAYMENT_RECORDED',
    entityType: 'PAYMENT',
    entityId: 'payment-1',
    timestamp: '2026-08-20T10:00:00.000Z',
    metadata: { invoiceId: 'invoice-1', amount: 5000 },
  },
];

const cancellation: CreateAuditEventInput = {
  actorId: 'admin-2',
  actorName: 'Admin Two',
  action: 'INVOICE_CANCELLED',
  entityType: 'INVOICE',
  entityId: 'invoice-u1-2026-08',
  metadata: { reason: 'admin cancellation' },
};

describe('Phase 3H.2 audit service', () => {
  it('creates events with deterministic IDs and exposes recent activity', async () => {
    const repository = createMockAuditRepository(
      seed,
      () => '2026-08-22T10:00:00.000Z',
    );
    const service = createAuditService(repository);
    const event = await service.createAuditEvent(cancellation);

    expect(event).toMatchObject({
      id: 'audit-0002',
      timestamp: '2026-08-22T10:00:00.000Z',
      action: 'INVOICE_CANCELLED',
    });
    expect((await service.getRecentActivity())[0]?.id).toBe('audit-0002');
  });

  it('is append-only and prevents event deletion', () => {
    const repository = createMockAuditRepository(seed);
    repository.create(cancellation);

    expect(repository.list()).toHaveLength(2);
    expect(() => repository.deleteEvent('audit-0001')).toThrow(
      'Audit events are append-only',
    );
    expect(repository.list()).toHaveLength(2);
  });

  it('returns entity history newest first', async () => {
    const repository = createMockAuditRepository(seed);
    const service = createAuditService(repository);
    repository.create({
      ...cancellation,
      entityId: 'invoice-shared',
      timestamp: '2026-08-21T10:00:00.000Z',
    });
    repository.create({
      ...cancellation,
      entityId: 'invoice-shared',
      timestamp: '2026-08-22T10:00:00.000Z',
    });

    const history = await service.getEntityHistory('INVOICE', 'invoice-shared');
    expect(history.map(event => event.timestamp)).toEqual([
      '2026-08-22T10:00:00.000Z',
      '2026-08-21T10:00:00.000Z',
    ]);
  });

  it('filters by actor, action, entity, date and search metadata', async () => {
    const repository = createMockAuditRepository(seed);
    const service = createAuditService(repository);
    repository.create({
      ...cancellation,
      timestamp: '2026-08-22T10:00:00.000Z',
      metadata: { reason: 'duplicate charge' },
    });

    const events = await service.getAuditEvents({
      actorId: 'admin-2',
      action: 'INVOICE_CANCELLED',
      entityType: 'INVOICE',
      from: '2026-08-22T00:00:00.000Z',
      to: '2026-08-22T23:59:59.999Z',
      search: 'duplicate',
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.entityId).toBe('invoice-u1-2026-08');
  });

  it('defensively clones inputs, outputs and metadata', () => {
    const externalSeed = seed.map(event => ({
      ...event,
      metadata: { ...event.metadata },
    }));
    const repository = createMockAuditRepository(externalSeed);
    externalSeed[0]!.actorName = 'Changed seed';
    const listed = repository.list();
    listed[0]!.actorName = 'Changed output';
    listed[0]!.metadata.amount = 0;

    expect(repository.list()[0]).toMatchObject({
      actorName: 'Admin One',
      metadata: { amount: 5000 },
    });
  });

  it('resets to the original seed and deterministic sequence', () => {
    const repository = createMockAuditRepository(seed);
    repository.create(cancellation);
    repository.reset();

    expect(repository.list()).toHaveLength(1);
    expect(repository.create(cancellation).id).toBe('audit-0002');
  });

  it('records an audit event only after a successful business mutation', () => {
    mockBillingRepository.reset();
    const repository = createMockAuditRepository([]);
    const cancelled = mockBillingRepository.cancelInvoice('invoice-u1-2026-08');
    if (cancelled.status === 'CANCELLED') {
      repository.create({
        ...cancellation,
        entityId: cancelled.id,
        metadata: { invoiceNumber: cancelled.invoiceNumber },
      });
    }

    expect(repository.list()).toHaveLength(1);
    expect(repository.list()[0]).toMatchObject({
      action: 'INVOICE_CANCELLED',
      entityId: cancelled.id,
    });

    const failedRepository = createMockAuditRepository([]);
    expect(() =>
      mockBillingRepository.cancelInvoice('missing-invoice'),
    ).toThrow();
    expect(failedRepository.list()).toHaveLength(0);
    mockBillingRepository.reset();
  });
});
