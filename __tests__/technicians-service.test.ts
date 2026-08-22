jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { mockComplaintRepository } from '@/services/api/complaints.mock.repository';
import { complaintsService } from '@/services/api/complaints.service';
import { mockTechnicianRepository } from '@/services/api/technicians.mock.repository';
import { techniciansService } from '@/services/api/technicians.service';

describe('techniciansService', () => {
  beforeEach(() => {
    mockComplaintRepository.reset();
    mockTechnicianRepository.reset();
  });

  it('lists seeded technicians with workload totals', async () => {
    const technicians = await techniciansService.getTechnicians();

    expect(technicians).toHaveLength(3);
    expect(technicians.map(item => item.name)).toEqual([
      'Ali Ahmed',
      'Usman Khan',
      'Hamza Ali',
    ]);
    expect(technicians[0]?.workload).toEqual({
      activeJobs: 0,
      availableCapacity: 1,
      completedJobs: 1,
    });
  });

  it('gets technician detail and rejects an unknown id', async () => {
    await expect(
      techniciansService.getTechnicianById('tech-ali'),
    ).resolves.toMatchObject({
      id: 'tech-ali',
      name: 'Ali Ahmed',
      area: { name: 'Karachi Central' },
    });
    await expect(
      techniciansService.getTechnicianById('missing'),
    ).rejects.toThrow('Technician not found');
  });

  it('filters by search, status and area', async () => {
    await expect(
      techniciansService.getTechnicians({ search: 'fiber installation' }),
    ).resolves.toHaveLength(1);
    await expect(
      techniciansService.getTechnicians({ status: 'BUSY' }),
    ).resolves.toEqual([expect.objectContaining({ id: 'tech-usman' })]);
    await expect(
      techniciansService.getTechnicians({ areaId: 'area-karachi-south' }),
    ).resolves.toEqual([expect.objectContaining({ id: 'tech-hamza' })]);
  });

  it('updates status and availability while protecting active workload', async () => {
    const available = await techniciansService.updateTechnicianStatus({
      id: 'tech-hamza',
      status: 'AVAILABLE',
    });
    expect(available.status).toBe('AVAILABLE');
    await expect(techniciansService.getAvailableTechnicians()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'tech-hamza' })]),
    );
    await expect(
      techniciansService.updateTechnicianStatus({
        id: 'tech-usman',
        status: 'AVAILABLE',
      }),
    ).rejects.toThrow('active work');
  });

  it('assigns a complaint, creates one work order and delegates complaint ownership', async () => {
    const assignment = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });

    expect(assignment).toMatchObject({
      id: 'assignment-0003',
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
      workOrder: { id: 'work-order-0003', status: 'ASSIGNED' },
    });
    await expect(
      techniciansService.getTechnicianWorkload('tech-ali'),
    ).resolves.toMatchObject({
      activeJobs: 1,
      completedJobs: 1,
    });
    await expect(
      complaintsService.getById('complaint-2054'),
    ).resolves.toMatchObject({
      status: 'assigned',
      technician: { id: 'tech-ali' },
    });
  });

  it('reassigns the active work order and records both sides of history', async () => {
    const assignment = await techniciansService.reassignComplaint({
      complaintId: 'complaint-2052',
      technicianId: 'tech-ali',
      reason: 'Area coverage changed',
    });

    expect(assignment.workOrder.status).toBe('ASSIGNED');
    const oldWorkload =
      await techniciansService.getTechnicianWorkload('tech-usman');
    expect(oldWorkload.activeJobs).toBe(0);
    expect(oldWorkload.assignments[0]?.workOrder.status).toBe('CANCELLED');
    await expect(
      techniciansService.getTechnicianHistory('tech-usman'),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'REASSIGNED_FROM' }),
      ]),
    );
    await expect(
      techniciansService.getTechnicianHistory('tech-ali'),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'REASSIGNED_TO' }),
      ]),
    );
  });

  it('protects invalid, duplicate, busy, completed and missing assignments', async () => {
    await expect(
      techniciansService.assignComplaint({
        complaintId: '',
        technicianId: 'tech-ali',
      }),
    ).rejects.toThrow('Complaint is required');
    await expect(
      techniciansService.assignComplaint({
        complaintId: 'complaint-2054',
        technicianId: 'missing',
      }),
    ).rejects.toThrow('Technician not found');
    await expect(
      techniciansService.assignComplaint({
        complaintId: 'complaint-2054',
        technicianId: 'tech-usman',
      }),
    ).rejects.toThrow('Busy technician');
    await techniciansService.updateTechnicianStatus({
      id: 'tech-hamza',
      status: 'AVAILABLE',
    });
    await expect(
      techniciansService.assignComplaint({
        complaintId: 'complaint-2052',
        technicianId: 'tech-hamza',
      }),
    ).rejects.toThrow('active work order');
    await expect(
      techniciansService.assignComplaint({
        complaintId: 'complaint-2051',
        technicianId: 'tech-hamza',
      }),
    ).rejects.toThrow('Completed work orders are immutable');
  });

  it('rejects offline technicians', async () => {
    await expect(
      techniciansService.assignComplaint({
        complaintId: 'complaint-2054',
        technicianId: 'tech-hamza',
      }),
    ).rejects.toThrow('Offline technician cannot receive work');
  });

  it('resets state and deterministic ids', async () => {
    await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });
    mockComplaintRepository.reset();
    mockTechnicianRepository.reset();

    const technician = await techniciansService.getTechnicianById('tech-ali');
    expect(technician.status).toBe('AVAILABLE');
    expect(technician.workload.activeJobs).toBe(0);
    const assignment = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });
    expect(assignment.id).toBe('assignment-0003');
  });

  it('returns defensive clones from every repository view', () => {
    const list = mockTechnicianRepository.listTechnicians();
    list[0]!.name = 'Mutated';
    list[0]!.skills[0]!.name = 'Mutated skill';
    const snapshot = mockTechnicianRepository.snapshot();
    snapshot.workOrders[0]!.status = 'CANCELLED';
    snapshot.history[0]!.note = 'Mutated history';

    const technician = mockTechnicianRepository.getTechnicianById('tech-ali');
    expect(technician?.name).toBe('Ali Ahmed');
    expect(technician?.skills[0]?.name).toBe('Fiber Installation');
    expect(
      mockTechnicianRepository.getWorkOrders('tech-usman')[0]?.status,
    ).toBe('IN_PROGRESS');
    expect(mockTechnicianRepository.getHistory('tech-ali')[0]?.note).toBe(
      'Work order completed',
    );
  });

  it('returns status and work-order history as clones', async () => {
    await techniciansService.updateTechnicianStatus({
      id: 'tech-hamza',
      status: 'ON_LEAVE',
    });
    const history = await techniciansService.getTechnicianHistory('tech-hamza');
    expect(history[0]).toMatchObject({ action: 'STATUS_CHANGED' });
    history[0]!.note = 'Changed outside repository';
    await expect(
      techniciansService.getTechnicianHistory('tech-hamza'),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          note: 'Status changed from OFFLINE to ON_LEAVE',
        }),
      ]),
    );
  });

  it('accepts an assigned work order and records history', async () => {
    const assigned = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });

    const accepted = await techniciansService.acceptWorkOrder(
      assigned.workOrder.id,
    );

    expect(accepted.workOrder.status).toBe('ACCEPTED');
    await expect(
      techniciansService.getTechnicianHistory('tech-ali'),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'WORK_ORDER_ACCEPTED' }),
      ]),
    );
  });

  it('starts an accepted work order and synchronizes the complaint', async () => {
    const assigned = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });
    await techniciansService.acceptWorkOrder(assigned.workOrder.id);

    const started = await techniciansService.startWorkOrder(
      assigned.workOrder.id,
    );

    expect(started.workOrder.status).toBe('IN_PROGRESS');
    await expect(
      complaintsService.getById('complaint-2054'),
    ).resolves.toMatchObject({ status: 'in_progress' });
  });

  it('completes in-progress work, resolves its complaint and releases capacity', async () => {
    const assigned = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });
    await techniciansService.acceptWorkOrder(assigned.workOrder.id);
    await techniciansService.startWorkOrder(assigned.workOrder.id);

    const completed = await techniciansService.completeWorkOrder(
      assigned.workOrder.id,
    );
    const workload = await techniciansService.getTechnicianWorkload('tech-ali');

    expect(completed.workOrder.status).toBe('COMPLETED');
    expect(completed.workOrder.completedAt).not.toBeNull();
    expect(workload).toMatchObject({
      capacity: 1,
      activeJobs: 0,
      availableCapacity: 1,
      completedJobs: 2,
    });
    await expect(
      complaintsService.getById('complaint-2054'),
    ).resolves.toMatchObject({ status: 'resolved' });
    await expect(
      techniciansService.getTechnicianById('tech-ali'),
    ).resolves.toMatchObject({ status: 'AVAILABLE' });
  });

  it.each(['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] as const)(
    'cancels a work order from %s and prevents continuation',
    async status => {
      const assigned = await techniciansService.assignComplaint({
        complaintId: 'complaint-2054',
        technicianId: 'tech-ali',
      });
      if (status === 'ACCEPTED' || status === 'IN_PROGRESS') {
        await techniciansService.acceptWorkOrder(assigned.workOrder.id);
      }
      if (status === 'IN_PROGRESS') {
        await techniciansService.startWorkOrder(assigned.workOrder.id);
      }

      const cancelled = await techniciansService.cancelWorkOrder(
        assigned.workOrder.id,
      );

      expect(cancelled.workOrder.status).toBe('CANCELLED');
      await expect(
        techniciansService.acceptWorkOrder(assigned.workOrder.id),
      ).rejects.toThrow('Cancelled work orders cannot continue');
      const history = await techniciansService.getTechnicianHistory('tech-ali');
      expect(history).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'WORK_ORDER_CANCELLED' }),
        ]),
      );
    },
  );

  it('rejects skipped, repeated and completed work-order transitions', async () => {
    const assigned = await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });

    await expect(
      techniciansService.startWorkOrder(assigned.workOrder.id),
    ).rejects.toThrow('Invalid work order transition');
    await techniciansService.acceptWorkOrder(assigned.workOrder.id);
    await expect(
      techniciansService.completeWorkOrder(assigned.workOrder.id),
    ).rejects.toThrow('Invalid work order transition');
    await expect(
      techniciansService.acceptWorkOrder(assigned.workOrder.id),
    ).rejects.toThrow('Invalid work order transition');
    await expect(
      techniciansService.cancelWorkOrder('work-order-0002'),
    ).rejects.toThrow('Completed work orders are immutable');
  });

  it('derives workload from assignments and rejects capacity overflow', async () => {
    await techniciansService.assignComplaint({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });

    const workload = await techniciansService.getTechnicianWorkload('tech-ali');
    expect(workload.activeJobs).toBe(
      workload.assignments.filter(item =>
        ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(item.workOrder.status),
      ).length,
    );
    expect(workload).toMatchObject({
      capacity: 1,
      activeJobs: 1,
      availableCapacity: 0,
    });
    await expect(
      techniciansService.assignComplaint({
        complaintId: 'complaint-2053',
        technicianId: 'tech-ali',
      }),
    ).rejects.toThrow('Technician capacity exceeded');
  });

  it('completes active work when its complaint is resolved directly', async () => {
    await complaintsService.updateStatus({
      complaintId: 'complaint-2052',
      status: 'resolved',
    });

    const workload =
      await techniciansService.getTechnicianWorkload('tech-usman');
    expect(workload.activeJobs).toBe(0);
    expect(workload.completedJobs).toBe(1);
    expect(workload.assignments[0]?.workOrder.status).toBe('COMPLETED');
    await expect(
      techniciansService.getTechnicianHistory('tech-usman'),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'WORK_ORDER_COMPLETED' }),
      ]),
    );
  });

  it('preserves completed work and history when complaint state is reopened', async () => {
    await complaintsService.updateStatus({
      complaintId: 'complaint-2052',
      status: 'resolved',
    });
    const historyBefore =
      await techniciansService.getTechnicianHistory('tech-usman');

    mockComplaintRepository.reset();

    await expect(
      complaintsService.getById('complaint-2052'),
    ).resolves.toMatchObject({ status: 'in_progress' });
    const workload =
      await techniciansService.getTechnicianWorkload('tech-usman');
    const historyAfter =
      await techniciansService.getTechnicianHistory('tech-usman');
    expect(workload.assignments[0]?.workOrder.status).toBe('COMPLETED');
    expect(historyAfter).toEqual(historyBefore);
  });
});
