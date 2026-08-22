import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';
import {
  mapComplaint,
  mapComplaintStatusToDto,
  mapTechnician,
} from './complaints.mapper';
import { mockComplaintRepository } from './complaints.mock.repository';
import { mockTechnicianRepository } from './technicians.mock.repository';
import type {
  AdminComplaint,
  AdminComplaintStatus,
  AdminTechnicianOption,
  AssignComplaintInput,
  ComplaintDto,
  ReplyToComplaintInput,
  TechnicianDto,
  UpdateComplaintDto,
  UpdateComplaintStatusInput,
} from './complaints.models';

const statusFlow: AdminComplaintStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
];

function assertComplaintOpen(complaint: AdminComplaint) {
  if (complaint.status === 'closed') {
    throw new Error('Closed complaints cannot be modified');
  }
}

function assertNextStatus(
  complaint: AdminComplaint,
  status: AdminComplaintStatus,
) {
  assertComplaintOpen(complaint);
  const currentIndex = statusFlow.indexOf(complaint.status);
  if (statusFlow[currentIndex + 1] !== status) {
    throw new Error('Complaint status must follow the approved workflow');
  }
  if (status === 'assigned' && !complaint.technician) {
    throw new Error('Assign a technician before updating this complaint');
  }
}

async function liveUpdate(
  complaintId: string,
  update: UpdateComplaintDto,
): Promise<AdminComplaint> {
  await apiRequest<unknown>(`/complaints/${encodeURIComponent(complaintId)}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
  return complaintsService.getById(complaintId);
}

export const complaintsService = {
  async list(): Promise<AdminComplaint[]> {
    if (environment.useMockApi) {
      await mockDelay();
      return mockComplaintRepository.list().map(mapComplaint);
    }

    const response = await apiRequest<ComplaintDto[]>('/complaints');
    return response.map(mapComplaint);
  },

  async getById(id: string): Promise<AdminComplaint> {
    if (environment.useMockApi) {
      await mockDelay();
      const complaint = mockComplaintRepository.getById(id);
      if (!complaint) throw new Error('Complaint not found');
      return mapComplaint(complaint);
    }

    const complaints = await complaintsService.list();
    const complaint = complaints.find(item => item.id === id);
    if (!complaint) throw new Error('Complaint not found');
    return complaint;
  },

  async listTechnicians(): Promise<AdminTechnicianOption[]> {
    if (environment.useMockApi) {
      await mockDelay();
      return mockComplaintRepository.technicians().map(mapTechnician);
    }

    const response = await apiRequest<TechnicianDto[]>('/technicians');
    return response.map(mapTechnician);
  },

  async assignTechnician(input: AssignComplaintInput): Promise<AdminComplaint> {
    if (environment.useMockApi) {
      await mockDelay(500);
      return mapComplaint(mockComplaintRepository.assign(input));
    }

    const existing = await complaintsService.getById(input.complaintId);
    assertComplaintOpen(existing);
    return liveUpdate(input.complaintId, {
      technicianId: input.technicianId,
      ...(existing.status === 'pending' ? { status: 'ASSIGNED' as const } : {}),
    });
  },

  async updateStatus(
    input: UpdateComplaintStatusInput,
  ): Promise<AdminComplaint> {
    if (environment.useMockApi) {
      await mockDelay(500);
      const updated = mapComplaint(mockComplaintRepository.updateStatus(input));
      if (updated.status === 'resolved') {
        mockTechnicianRepository.synchronizeResolvedComplaint(updated.id);
      }
      return updated;
    }

    const existing = await complaintsService.getById(input.complaintId);
    assertNextStatus(existing, input.status);
    return liveUpdate(input.complaintId, {
      status: mapComplaintStatusToDto(input.status),
    });
  },

  async reply(input: ReplyToComplaintInput): Promise<AdminComplaint> {
    if (environment.useMockApi) {
      await mockDelay(500);
      return mapComplaint(mockComplaintRepository.reply(input));
    }

    const reply = input.reply.trim();
    if (!reply) throw new Error('Admin reply cannot be empty');
    const existing = await complaintsService.getById(input.complaintId);
    assertComplaintOpen(existing);
    return liveUpdate(input.complaintId, { adminReply: reply });
  },
};
