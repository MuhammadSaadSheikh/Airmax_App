import { environment } from '@/config/environment';
import { customers } from '@/services/mockData';
import type { User } from '@/types';
import { apiRequest, mockDelay } from './client';

export const customersService = {
  async list(): Promise<User[]> {
    if (!environment.useMockApi) return apiRequest<User[]>('/users');
    await mockDelay();
    return customers;
  },
};
