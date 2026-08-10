jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { mapComplaint } from '@/services/api/complaints.mapper';
import { mockComplaintRepository } from '@/services/api/complaints.mock.repository';
import { mockComplaints } from '@/services/api/complaints.mock';
import { complaintsService } from '@/services/api/complaints.service';

describe('Phase 3C admin complaint operations service', () => {
  beforeEach(() => mockComplaintRepository.reset());

  it('maps backend complaint data into semantic domain models', () => {
    const complaint = mapComplaint(mockComplaints[0]!);

    expect(complaint).toEqual(
      expect.objectContaining({
        ticketNumber: 2054,
        status: 'pending',
        customer: expect.objectContaining({ name: 'Ahmed Khan' }),
      }),
    );
    expect(complaint).not.toHaveProperty('userId');
    expect(complaint).not.toHaveProperty('technicianId');
  });

  it('assigns a technician and advances a pending complaint', async () => {
    const complaint = await complaintsService.assignTechnician({
      complaintId: 'complaint-2054',
      technicianId: 'tech-ali',
    });

    expect(complaint.status).toBe('assigned');
    expect(complaint.technician?.name).toBe('Ali Raza');
    expect(complaint.events.at(-1)?.status).toBe('assigned');
  });

  it('preserves workflow status when reassigning active work', async () => {
    const complaint = await complaintsService.assignTechnician({
      complaintId: 'complaint-2052',
      technicianId: 'tech-sana',
    });

    expect(complaint.status).toBe('in_progress');
    expect(complaint.technician?.name).toBe('Sana Javed');
  });

  it('enforces forward-only status transitions', async () => {
    await expect(
      complaintsService.updateStatus({
        complaintId: 'complaint-2053',
        status: 'resolved',
      }),
    ).rejects.toThrow('approved workflow');
  });

  it('stores only the current admin reply', async () => {
    const complaint = await complaintsService.reply({
      complaintId: 'complaint-2053',
      reply: '  Technician arrival is scheduled for 3 PM.  ',
    });

    expect(complaint.adminReply).toBe(
      'Technician arrival is scheduled for 3 PM.',
    );
  });

  it('prevents modifications to closed complaints', async () => {
    await expect(
      complaintsService.reply({
        complaintId: 'complaint-2050',
        reply: 'This should not be saved.',
      }),
    ).rejects.toThrow('Closed complaints cannot be modified');
  });
});
