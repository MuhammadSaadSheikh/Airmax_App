import { mockComplaintApiService } from '@/services/api/complaint/complaint.mock.service';
import { resolveMockCustomer } from '@/services/api/mockCustomerContext';
import { copySupportCategories } from './supportCategories';
import type { SupportService } from './supportService.types';

const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export const mockSupportService: SupportService = {
  async getComplaints(connectionId) {
    const customer = resolveMockCustomer(connectionId);
    return mockComplaintApiService.getCustomerComplaints(customer.id);
  },

  async createComplaint(connectionId, input) {
    resolveMockCustomer(connectionId);
    return mockComplaintApiService.createComplaint(input);
  },

  async getComplaintDetail(connectionId, id) {
    const customer = resolveMockCustomer(connectionId);
    const complaints = await mockComplaintApiService.getCustomerComplaints(
      customer.id,
    );
    if (!complaints.some(item => item.id === id)) return undefined;
    return mockComplaintApiService.getComplaintById(id);
  },

  async getCategories() {
    await mockDelay(180);
    return copySupportCategories();
  },
};
