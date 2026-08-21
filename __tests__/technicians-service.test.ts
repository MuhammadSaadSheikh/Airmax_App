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
        complaintId: 'complaint-historical-ali',
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
});
