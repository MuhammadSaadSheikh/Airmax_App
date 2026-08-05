import { environment } from '@/config/environment';
import { bills } from '@/services/mockData';
import type { Bill } from '@/types';
import { apiRequest, mockDelay } from './client';

export type PaymentResult = {
  id: string;
  method: string;
  receipt: string;
  status: 'paid';
};

export const billingService = {
  async listInvoices(): Promise<Bill[]> {
    if (!environment.useMockApi)
      return apiRequest<Bill[]>('/payments/invoices/me');
    await mockDelay();
    return bills;
  },
  async payBill(id: string, method: string): Promise<PaymentResult> {
    if (!environment.useMockApi)
      return apiRequest<PaymentResult>(`/payments/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ method }),
      });
    await mockDelay(500);
    return { id, method, receipt: `RCP-${Date.now()}`, status: 'paid' };
  },
};
