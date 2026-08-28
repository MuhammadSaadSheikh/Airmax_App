import { apiRequest } from '../client';
import {
  mapComplaintDto,
  mapComplaintListDto,
  mapCreateComplaintInput,
} from './complaint.mapper';
import type { ComplaintApiService, ComplaintDto } from './complaint.models';

export const liveComplaintApiService: ComplaintApiService = {
  async getCustomerComplaints(customerId) {
    const complaints = await apiRequest<ComplaintDto[]>(
      `/customers/${encodeURIComponent(customerId)}/complaints`,
    );
    return complaints.map(mapComplaintListDto);
  },

  async getComplaintById(id) {
    return mapComplaintDto(
      await apiRequest<ComplaintDto>(`/complaints/${encodeURIComponent(id)}`),
    );
  },

  async createComplaint(input) {
    return mapComplaintDto(
      await apiRequest<ComplaintDto>('/complaints', {
        method: 'POST',
        body: JSON.stringify(mapCreateComplaintInput(input)),
      }),
    );
  },
};
