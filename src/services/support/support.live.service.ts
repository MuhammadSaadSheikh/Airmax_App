import { liveComplaintApiService } from '@/services/api/complaint/complaint.live.service';
import { copySupportCategories } from './supportCategories';
import type { SupportService } from './supportService.types';

export const liveSupportService: SupportService = {
  getComplaints(customerId) {
    return liveComplaintApiService.getCustomerComplaints(customerId);
  },

  createComplaint(_customerId, input) {
    return liveComplaintApiService.createComplaint(input);
  },

  async getComplaintDetail(_customerId, id) {
    return liveComplaintApiService.getComplaintById(id);
  },

  async getCategories() {
    return copySupportCategories();
  },
};
