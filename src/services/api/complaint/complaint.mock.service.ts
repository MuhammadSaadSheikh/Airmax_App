import { mockComplaintRepository } from '../complaints.mock.repository';
import type { ComplaintDto as LegacyComplaintDto } from '../complaints.models';
import { resolveMockCustomer } from '../mockCustomerContext';
import { mockTechnicianRepository } from '../technicians.mock.repository';
import { mapComplaintDto } from './complaint.mapper';
import type {
  ComplaintApiService,
  ComplaintDto,
  ComplaintHistoryDto,
  ComplaintWorkOrderSummaryDto,
} from './complaint.models';

const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

function history(dto: LegacyComplaintDto): ComplaintHistoryDto[] {
  return dto.events.map(event => ({
    id: event.id,
    type: 'STATUS_CHANGED',
    actorId: event.actorId,
    previousStatus: null,
    currentStatus: event.status,
    message: event.note,
    metadata: null,
    occurredAt: event.createdAt,
  }));
}

function workOrders(complaintId: string): ComplaintWorkOrderSummaryDto[] {
  const snapshot = mockTechnicianRepository.snapshot();
  return snapshot.workOrders
    .filter(item => item.complaintId === complaintId)
    .map(item => {
      const events = snapshot.history.filter(
        event => event.workOrderId === item.id,
      );
      return {
        id: item.id,
        status: item.status,
        assignedAt: item.createdAt,
        acceptedAt:
          events.find(event => event.action === 'WORK_ORDER_ACCEPTED')
            ?.createdAt ?? null,
        startedAt:
          events.find(event => event.action === 'WORK_ORDER_STARTED')
            ?.createdAt ?? null,
        completedAt: item.completedAt,
      };
    });
}

function productionDto(dto: LegacyComplaintDto): ComplaintDto {
  return {
    id: dto.id,
    ticketNumber: dto.ticketNumber,
    customerId: dto.userId,
    category: dto.category,
    title: dto.title,
    priority: 'MEDIUM',
    description: dto.description,
    attachmentUrl: dto.attachmentUrl,
    status: dto.status,
    resolvedAt: dto.resolvedAt,
    closedAt: dto.status === 'CLOSED' ? dto.updatedAt : null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    history: history(dto),
    workOrders: workOrders(dto.id),
  };
}

function requireComplaint(id: string): LegacyComplaintDto {
  const complaint = mockComplaintRepository.getById(id);
  const customer = resolveMockCustomer('unknown');
  if (!complaint || complaint.userId !== customer.id) {
    throw new Error('Complaint not found');
  }
  return complaint;
}

export const mockComplaintApiService: ComplaintApiService = {
  async getCustomerComplaints(customerId) {
    await mockDelay();
    const customer = resolveMockCustomer('unknown');
    if (customerId !== customer.id) throw new Error('Customer access denied');
    return mockComplaintRepository
      .list()
      .filter(item => item.userId === customerId)
      .map(productionDto)
      .map(mapComplaintDto);
  },

  async getComplaintById(id) {
    await mockDelay();
    return mapComplaintDto(productionDto(requireComplaint(id)));
  },

  async createComplaint(input) {
    await mockDelay(650);
    const customer = resolveMockCustomer('unknown');
    return mapComplaintDto(
      productionDto(
        mockComplaintRepository.create({
          customerId: customer.id,
          customer: {
            name: customer.name,
            phone: customer.phone,
            connectionId: customer.connectionId,
          },
          category: input.category,
          title: input.title.trim(),
          description: input.description.trim(),
          attachmentUrl: input.attachments?.[0]?.uri ?? null,
        }),
      ),
    );
  },
};
