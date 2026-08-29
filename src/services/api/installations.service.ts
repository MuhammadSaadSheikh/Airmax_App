import { environment } from '@/config/environment';
import { mockDelay } from './client';

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
  supportsSubmission: environment.useMockApi,

  async create(payload: InstallationRequest): Promise<InstallationResult> {
    if (!environment.useMockApi) {
      throw new Error(
        'Installation requests are unavailable until a public backend contract exists.',
      );
    }
    await mockDelay(500);
    return { id: `INS-${Date.now()}`, payload, status: 'pending' };
  },
};
