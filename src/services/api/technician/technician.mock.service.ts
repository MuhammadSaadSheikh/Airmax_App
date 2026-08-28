import { mockComplaintRepository } from '../complaints.mock.repository';
import { resolveMockCustomer } from '../mockCustomerContext';
import { mockTechnicianRepository } from '../technicians.mock.repository';
import { mapAssignedTechnicianDto } from './technician.mapper';
import type { TechnicianVisibilityApiService } from './technician.models';

const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export const mockTechnicianVisibilityApiService: TechnicianVisibilityApiService =
  {
    async getComplaintTechnician(complaintId) {
      await mockDelay();
      const complaint = mockComplaintRepository.getById(complaintId);
      const customer = resolveMockCustomer('unknown');
      if (!complaint || complaint.userId !== customer.id) {
        throw new Error('Complaint not found');
      }
      if (!complaint?.technicianId) return undefined;
      const technician = mockTechnicianRepository.getTechnicianById(
        complaint.technicianId,
      );
      if (!technician) return undefined;
      return mapAssignedTechnicianDto({
        id: technician.id,
        name: technician.name,
        status: technician.status,
        skills: technician.skills.map(skill => skill.name),
        serviceArea: {
          city: technician.area.city,
          name: technician.area.name,
        },
      });
    },
  };
