const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  mockDelay: jest.fn(() => Promise.resolve()),
}));

import { ApiError, AuthorizationError } from '../src/services/api/apiError';
import { mapComplaintDto } from '../src/services/api/complaint/complaint.mapper';
import type { ComplaintDto } from '../src/services/api/complaint/complaint.models';
import { liveComplaintApiService } from '../src/services/api/complaint/complaint.live.service';
import { liveTechnicianVisibilityApiService } from '../src/services/api/technician/technician.live.service';
import { mockTechnicianVisibilityApiService } from '../src/services/api/technician/technician.mock.service';
import { liveWorkOrderTrackingApiService } from '../src/services/api/workOrder/workOrder.live.service';
import { mockWorkOrderTrackingApiService } from '../src/services/api/workOrder/workOrder.mock.service';
import { mockComplaintRepository } from '../src/services/api/complaints.mock.repository';
import { mockSystemRepository } from '../src/services/api/mockSystem.repository';
import { mockTechnicianRepository } from '../src/services/api/technicians.mock.repository';

const complaintDto: ComplaintDto = {
  id: 'complaint-1',
  ticketNumber: 101,
  customerId: 'customer-1',
  category: 'Internet issue',
  title: 'Connection unavailable',
  priority: 'HIGH',
  description: 'No signal since morning',
  attachmentUrl: null,
  status: 'ASSIGNED',
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-08-28T08:00:00.000Z',
  updatedAt: '2026-08-28T08:05:00.000Z',
  history: [
    {
      id: 'history-1',
      type: 'CREATED',
      actorId: 'user-1',
      previousStatus: null,
      currentStatus: 'PENDING',
      message: null,
      metadata: null,
      occurredAt: '2026-08-28T08:00:00.000Z',
    },
    {
      id: 'history-2',
      type: 'ASSIGNMENT_CHANGED',
      actorId: 'admin-1',
      previousStatus: 'PENDING',
      currentStatus: 'ASSIGNED',
      message: null,
      metadata: { internal: 'not-mapped' },
      occurredAt: '2026-08-28T08:05:00.000Z',
    },
  ],
  workOrders: [
    {
      id: 'work-order-1',
      status: 'ASSIGNED',
      assignedAt: '2026-08-28T08:05:00.000Z',
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
    },
  ],
};

describe('Phase 4.4F production API services and mapping', () => {
  beforeEach(() => mockApiRequest.mockReset());

  it('creates a customer-owned complaint without customerId or local attachments', async () => {
    mockApiRequest.mockResolvedValue(complaintDto);
    await expect(
      liveComplaintApiService.createComplaint({
        category: 'internet',
        title: ' Connection unavailable ',
        description: ' No signal since morning ',
        attachments: [
          { id: 'local-1', type: 'image', uri: 'content://private/image' },
        ],
      }),
    ).resolves.toMatchObject({
      id: 'complaint-1',
      title: 'Connection unavailable',
      workOrderId: 'work-order-1',
    });

    const [path, request] = mockApiRequest.mock.calls[0]!;
    expect(path).toBe('/complaints');
    expect(request.method).toBe('POST');
    expect(JSON.parse(request.body)).toEqual({
      title: 'Connection unavailable',
      description: 'No signal since morning',
      category: 'Internet issue',
      priority: 'HIGH',
    });
  });

  it('loads customer complaint list and detail through production paths', async () => {
    mockApiRequest
      .mockResolvedValueOnce([complaintDto])
      .mockResolvedValueOnce(complaintDto);
    await expect(
      liveComplaintApiService.getCustomerComplaints('customer/1'),
    ).resolves.toHaveLength(1);
    await expect(
      liveComplaintApiService.getComplaintById('complaint/1'),
    ).resolves.toMatchObject({ id: 'complaint-1', status: 'assigned' });
    expect(mockApiRequest.mock.calls[0]?.[0]).toBe(
      '/customers/customer%2F1/complaints',
    );
    expect(mockApiRequest.mock.calls[1]?.[0]).toBe('/complaints/complaint%2F1');
  });

  it('maps only customer-safe technician fields and handles unassigned 404', async () => {
    mockApiRequest.mockResolvedValueOnce({
      id: 'technician-1',
      name: 'Field Engineer',
      status: 'INACTIVE',
      skills: ['Fiber', 'Routing'],
      serviceArea: { city: 'Karachi', name: 'Central' },
      phone: '+923001234567',
      capacity: 10,
    });
    const technician =
      await liveTechnicianVisibilityApiService.getComplaintTechnician(
        'complaint-1',
      );
    expect(technician).toEqual({
      id: 'technician-1',
      name: 'Field Engineer',
      status: 'inactive',
      skills: ['Fiber', 'Routing'],
      serviceArea: { city: 'Karachi', name: 'Central' },
    });
    expect(Object.keys(technician!)).toEqual([
      'id',
      'name',
      'status',
      'skills',
      'serviceArea',
    ]);

    mockApiRequest.mockRejectedValueOnce(
      new ApiError('Not assigned', 404, undefined, 'API_ERROR'),
    );
    await expect(
      liveTechnicianVisibilityApiService.getComplaintTechnician('unassigned'),
    ).resolves.toBeUndefined();
  });

  it('maps work-order status and timestamps without exposing mutations', async () => {
    mockApiRequest.mockResolvedValue({
      id: 'work-order-1',
      complaintId: 'complaint-1',
      status: 'IN_PROGRESS',
      technician: {
        id: 'technician-1',
        name: 'Field Engineer',
        status: 'BUSY',
      },
      assignedAt: '2026-08-28T08:05:00.000Z',
      acceptedAt: '2026-08-28T08:10:00.000Z',
      startedAt: '2026-08-28T08:20:00.000Z',
      completedAt: null,
      notes: 'internal',
    });
    await expect(
      liveWorkOrderTrackingApiService.getWorkOrderById('work-order-1'),
    ).resolves.toEqual({
      id: 'work-order-1',
      complaintId: 'complaint-1',
      status: 'in_progress',
      technician: {
        id: 'technician-1',
        name: 'Field Engineer',
        status: 'busy',
      },
      assignedAt: '2026-08-28T08:05:00.000Z',
      acceptedAt: '2026-08-28T08:10:00.000Z',
      startedAt: '2026-08-28T08:20:00.000Z',
      completedAt: null,
    });
    expect(mockApiRequest).toHaveBeenCalledWith('/work-orders/work-order-1');
  });

  it('propagates ownership errors and presents legacy null titles safely', async () => {
    const forbidden = new AuthorizationError(
      'Complaint access denied',
      403,
      undefined,
      'FORBIDDEN',
    );
    mockApiRequest.mockRejectedValue(forbidden);
    await expect(
      liveComplaintApiService.getComplaintById('foreign'),
    ).rejects.toBe(forbidden);
    expect(mapComplaintDto({ ...complaintDto, title: null }).title).toBe(
      'Title unavailable',
    );
  });

  it('preserves assignment-based technician and work-order tracking in mock mode', async () => {
    mockSystemRepository.reset();
    mockComplaintRepository.assign({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });
    const assignment = mockTechnicianRepository.assign({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });
    await expect(
      mockTechnicianVisibilityApiService.getComplaintTechnician(
        'complaint-2054',
      ),
    ).resolves.toMatchObject({
      id: 'tech-ali',
      skills: expect.any(Array),
      serviceArea: expect.any(Object),
    });
    await expect(
      mockWorkOrderTrackingApiService.getWorkOrderById(assignment.workOrderId),
    ).resolves.toMatchObject({
      complaintId: 'complaint-2054',
      status: 'assigned',
      technician: { id: 'tech-ali' },
    });

    await expect(
      mockTechnicianVisibilityApiService.getComplaintTechnician(
        'complaint-2052',
      ),
    ).rejects.toThrow('Complaint not found');
    await expect(
      mockWorkOrderTrackingApiService.getWorkOrderById('work-order-0001'),
    ).rejects.toThrow('Work order not found');
  });
});
