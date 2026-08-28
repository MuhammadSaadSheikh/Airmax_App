import type { AssignedTechnician } from '@/services/support/models';

export type TechnicianStatusDto =
  'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_LEAVE' | 'INACTIVE';

export type AssignedTechnicianDto = {
  id: string;
  name: string;
  status: TechnicianStatusDto;
  skills: string[];
  serviceArea: { city: string; name: string } | null;
};

export interface TechnicianVisibilityApiService {
  getComplaintTechnician(
    complaintId: string,
  ): Promise<AssignedTechnician | undefined>;
}
