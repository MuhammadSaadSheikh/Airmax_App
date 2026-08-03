import { bills, customers, packages } from './mockData';
import { environment } from '@/config/environment';
import { request } from './http';

const pause = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export const api = {
  packages: async () => {
    if (!environment.useMockApi) return request<typeof packages>('/packages');
    await pause(); return packages;
  },
  bills: async () => {
    if (!environment.useMockApi) return request<typeof bills>('/payments/invoices/me');
    await pause(); return bills;
  },
  customers: async () => {
    if (!environment.useMockApi) return request<typeof customers>('/users');
    await pause(); return customers;
  },
  payBill: async (id: string, method: string) => {
    if (!environment.useMockApi) return request<{ id: string; method: string; receipt: string; status: 'paid' }>(`/payments/${id}/verify`, { method: 'POST', body: JSON.stringify({ method }) });
    await pause(500); return { id, method, receipt: `RCP-${Date.now()}`, status: 'paid' as const };
  },
  requestInstallation: async (payload: unknown) => {
    if (!environment.useMockApi) return request<{ id: string; payload: unknown; status: 'pending' }>('/subscriptions/installations', { method: 'POST', body: JSON.stringify(payload) });
    await pause(500); return { id: `INS-${Date.now()}`, payload, status: 'pending' as const };
  },
};
