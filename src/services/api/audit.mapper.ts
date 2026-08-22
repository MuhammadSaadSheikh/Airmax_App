import type { AdminAuditEvent, AuditEventDto } from './audit.models';

export function mapAuditEvent(dto: AuditEventDto): AdminAuditEvent {
  return { ...dto, metadata: { ...dto.metadata } };
}

export function mapAuditEvents(dtos: AuditEventDto[]): AdminAuditEvent[] {
  return dtos.map(mapAuditEvent);
}
