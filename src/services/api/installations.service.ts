import { environment } from '@/config/environment';
import { apiRequest, mockDelay } from './client';

export type InstallationRequest = {
  name: string;
  phone: string;
  address: string;
  packageId: string;
  date: string;
};
export type InstallationResult = {
  id: string;
  payload: InstallationRequest;
  status: 'pending';
};

export const installationsService = {
  async create(payload: InstallationRequest): Promise<InstallationResult> {
    if (!environment.useMockApi)
      return apiRequest<InstallationResult>('/subscriptions/installations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    await mockDelay(500);
    return { id: `INS-${Date.now()}`, payload, status: 'pending' };
  },
};
