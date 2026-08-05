import { environment } from '@/config/environment';
import { packages } from '@/services/mockData';
import type { Package } from '@/types';
import { apiRequest, mockDelay } from './client';

export const packagesService = {
  async list(): Promise<Package[]> {
    if (!environment.useMockApi) return apiRequest<Package[]>('/packages');
    await mockDelay();
    return packages;
  },
};
