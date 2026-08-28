import { ApiError } from '../apiError';
import { apiRequest } from '../client';
import { mapAssignedTechnicianDto } from './technician.mapper';
import type {
  AssignedTechnicianDto,
  TechnicianVisibilityApiService,
} from './technician.models';

export const liveTechnicianVisibilityApiService: TechnicianVisibilityApiService =
  {
    async getComplaintTechnician(complaintId) {
      try {
        return mapAssignedTechnicianDto(
          await apiRequest<AssignedTechnicianDto>(
            `/complaints/${encodeURIComponent(complaintId)}/technician`,
          ),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return undefined;
        throw error;
      }
    },
  };
