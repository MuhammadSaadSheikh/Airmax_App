const mockGetComplaints = jest.fn();
const mockGetComplaint = jest.fn();
const mockCreateComplaint = jest.fn();
const mockGetTechnician = jest.fn();
const mockGetWorkOrder = jest.fn();

jest.mock('../src/services/api/complaint/complaint.service', () => ({
  complaintApiService: {
    getCustomerComplaints: (...args: unknown[]) => mockGetComplaints(...args),
    getComplaintById: (...args: unknown[]) => mockGetComplaint(...args),
    createComplaint: (...args: unknown[]) => mockCreateComplaint(...args),
  },
}));

jest.mock('../src/services/api/technician/technician.service', () => ({
  technicianVisibilityApiService: {
    getComplaintTechnician: (...args: unknown[]) => mockGetTechnician(...args),
  },
}));

jest.mock('../src/services/api/workOrder/workOrder.service', () => ({
  workOrderTrackingApiService: {
    getWorkOrderById: (...args: unknown[]) => mockGetWorkOrder(...args),
  },
}));

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../src/services/query/queryKeys';
import {
  complaintDetailQueryOptions,
  complaintTechnicianQueryOptions,
  customerComplaintsQueryOptions,
  invalidateSupportQueries,
  workOrderTrackingQueryOptions,
} from '../src/services/support/supportQueries';

const complaint = {
  id: 'complaint-1',
  status: 'assigned',
  workOrderId: 'work-order-1',
};
const technician = { id: 'technician-1', name: 'Engineer' };
const workOrder = { id: 'work-order-1', status: 'assigned' };

function queryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('Phase 4.4F React Query integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetComplaints.mockResolvedValue([complaint]);
    mockGetComplaint.mockResolvedValue(complaint);
    mockCreateComplaint.mockResolvedValue(complaint);
    mockGetTechnician.mockResolvedValue(technician);
    mockGetWorkOrder.mockResolvedValue(workOrder);
  });

  it('loads complaint list/detail, technician visibility, and work order', async () => {
    const client = queryClient();
    await expect(
      client.fetchQuery(customerComplaintsQueryOptions('customer-1')),
    ).resolves.toEqual([complaint]);
    await expect(
      client.fetchQuery(
        complaintDetailQueryOptions('customer-1', 'complaint-1'),
      ),
    ).resolves.toEqual(complaint);
    await expect(
      client.fetchQuery(complaintTechnicianQueryOptions('complaint-1')),
    ).resolves.toEqual(technician);
    await expect(
      client.fetchQuery(workOrderTrackingQueryOptions('work-order-1')),
    ).resolves.toEqual(workOrder);
    expect(mockGetComplaints).toHaveBeenCalledWith('customer-1');
    expect(mockGetTechnician).toHaveBeenCalledWith('complaint-1');
    client.clear();
  });

  it('exposes loading and API failure without a mock fallback', async () => {
    const client = queryClient();
    let rejectRequest!: (error: Error) => void;
    mockGetComplaint.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
    );
    const options = complaintDetailQueryOptions('customer-1', 'complaint-1');
    const request = client.fetchQuery(options);
    expect(client.getQueryState(options.queryKey)?.status).toBe('pending');
    const error = new Error('Complaint unavailable');
    rejectRequest(error);
    await expect(request).rejects.toBe(error);
    client.clear();
  });

  it('invalidates complaint, technician, work-order, and dashboard caches', async () => {
    const client = queryClient();
    const keys = [
      queryKeys.supportComplaints('customer-1'),
      queryKeys.supportComplaintDetail('customer-1', 'complaint-1'),
      queryKeys.supportComplaintTechnician('complaint-1'),
      queryKeys.customerWorkOrderDetail('work-order-1'),
      queryKeys.customerDashboard('AMX-1'),
    ];
    keys.forEach(key => client.setQueryData(key, {}));
    await invalidateSupportQueries(client, {
      customerId: 'customer-1',
      complaintId: 'complaint-1',
      workOrderId: 'work-order-1',
      connectionId: 'AMX-1',
    });
    keys.forEach(key =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(true),
    );
    client.clear();
  });

  it('refetches complaint data after invalidation', async () => {
    const client = queryClient();
    const options = customerComplaintsQueryOptions('customer-1');
    await client.fetchQuery(options);
    await invalidateSupportQueries(client, { customerId: 'customer-1' });
    await client.fetchQuery(options);
    expect(mockGetComplaints).toHaveBeenCalledTimes(2);
    client.clear();
  });
});
