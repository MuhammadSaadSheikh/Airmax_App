import { complaintsService } from './complaints.service';
import {
  mapTechnician,
  mapTechnicianAssignment,
  mapTechnicianWorkload,
} from './technicians.mapper';
import { mockTechnicianRepository } from './technicians.mock.repository';
import type {
  AdminTechnician,
  AssignTechnicianComplaintInput,
  ReassignTechnicianComplaintInput,
  TechnicianAssignment,
  TechnicianFilters,
  TechnicianHistory,
  TechnicianWorkload,
  UpdateTechnicianStatusInput,
} from './technicians.models';

function workloadFor(id: string): TechnicianWorkload {
  return mapTechnicianWorkload(
    id,
    mockTechnicianRepository.getAssignments(id),
    mockTechnicianRepository.getWorkOrders(id),
  );
}

function mappedAssignment(id: string): TechnicianAssignment {
  const assignment = mockTechnicianRepository
    .snapshot()
    .assignments.find(item => item.id === id);
  if (!assignment) throw new Error('Technician assignment not found');
  const workOrder = mockTechnicianRepository
    .snapshot()
    .workOrders.find(item => item.id === assignment.workOrderId);
  if (!workOrder) throw new Error('Assignment work order not found');
  return mapTechnicianAssignment(assignment, workOrder);
}

async function assertAssignableComplaint(complaintId: string): Promise<void> {
  const complaint = await complaintsService.getById(complaintId);
  if (complaint.status === 'resolved' || complaint.status === 'closed') {
    throw new Error('Resolved or closed complaints cannot receive work');
  }
}

export const techniciansService = {
  async getTechnicians(
    filters: TechnicianFilters = {},
  ): Promise<AdminTechnician[]> {
    const search = filters.search?.trim().toLowerCase() ?? '';
    return mockTechnicianRepository
      .listTechnicians()
      .map(technician => mapTechnician(technician, workloadFor(technician.id)))
      .filter(technician => {
        const matchesSearch = [
          technician.name,
          technician.phone,
          technician.area.name,
          ...technician.skills.map(skill => skill.name),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
        return (
          matchesSearch &&
          (!filters.status || technician.status === filters.status) &&
          (!filters.areaId || technician.area.id === filters.areaId)
        );
      });
  },

  async getTechnicianById(id: string): Promise<AdminTechnician> {
    const technician = mockTechnicianRepository.getTechnicianById(id);
    if (!technician) throw new Error('Technician not found');
    return mapTechnician(technician, workloadFor(id));
  },

  async getAvailableTechnicians(): Promise<AdminTechnician[]> {
    return this.getTechnicians({ status: 'AVAILABLE' });
  },

  async getTechnicianWorkload(id: string): Promise<TechnicianWorkload> {
    return workloadFor(id);
  },

  async assignComplaint(
    input: AssignTechnicianComplaintInput,
  ): Promise<TechnicianAssignment> {
    mockTechnicianRepository.validateAssignment(input);
    await assertAssignableComplaint(input.complaintId);
    await complaintsService.assignTechnician(input);
    return mappedAssignment(mockTechnicianRepository.assign(input).id);
  },

  async reassignComplaint(
    input: ReassignTechnicianComplaintInput,
  ): Promise<TechnicianAssignment> {
    mockTechnicianRepository.validateReassignment(input);
    await assertAssignableComplaint(input.complaintId);
    await complaintsService.assignTechnician(input);
    return mappedAssignment(mockTechnicianRepository.reassign(input).id);
  },

  async updateTechnicianStatus(
    input: UpdateTechnicianStatusInput,
  ): Promise<AdminTechnician> {
    mockTechnicianRepository.updateStatus(input);
    return this.getTechnicianById(input.id);
  },

  async getTechnicianHistory(id: string): Promise<TechnicianHistory[]> {
    return mockTechnicianRepository.getHistory(id);
  },
};
