import type {
  TechnicianAssignmentDto,
  TechnicianDto,
  TechnicianWorkOrderDto,
} from './technicians.models';

export const mockTechnicians: TechnicianDto[] = [
  {
    id: 'tech-ali',
    name: 'Ali Ahmed',
    phone: '+92 300 555 0101',
    status: 'AVAILABLE',
    area: {
      id: 'area-karachi-central',
      name: 'Karachi Central',
      city: 'Karachi',
    },
    skills: [
      { id: 'skill-fiber', name: 'Fiber Installation' },
      { id: 'skill-router', name: 'Router Setup' },
      { id: 'skill-troubleshooting', name: 'Troubleshooting' },
    ],
    joinedAt: '2024-02-12T08:00:00.000Z',
  },
  {
    id: 'tech-usman',
    name: 'Usman Khan',
    phone: '+92 300 555 0102',
    status: 'BUSY',
    area: { id: 'area-karachi-east', name: 'Karachi East', city: 'Karachi' },
    skills: [
      { id: 'skill-troubleshooting', name: 'Troubleshooting' },
      { id: 'skill-splicing', name: 'Fiber Splicing' },
    ],
    joinedAt: '2023-09-04T08:00:00.000Z',
  },
  {
    id: 'tech-hamza',
    name: 'Hamza Ali',
    phone: '+92 300 555 0103',
    status: 'OFFLINE',
    area: { id: 'area-karachi-south', name: 'Karachi South', city: 'Karachi' },
    skills: [{ id: 'skill-router', name: 'Router Setup' }],
    joinedAt: '2025-01-20T08:00:00.000Z',
  },
];

export const mockTechnicianAssignments: TechnicianAssignmentDto[] = [
  {
    id: 'assignment-0001',
    complaintId: 'complaint-2052',
    technicianId: 'tech-usman',
    workOrderId: 'work-order-0001',
    assignedBy: 'admin-mock',
    assignedAt: '2026-08-08T10:00:00.000Z',
    endedAt: null,
  },
  {
    id: 'assignment-0002',
    complaintId: 'complaint-historical-ali',
    technicianId: 'tech-ali',
    workOrderId: 'work-order-0002',
    assignedBy: 'admin-mock',
    assignedAt: '2026-08-01T09:00:00.000Z',
    endedAt: '2026-08-01T12:30:00.000Z',
  },
];

export const mockTechnicianWorkOrders: TechnicianWorkOrderDto[] = [
  {
    id: 'work-order-0001',
    assignmentId: 'assignment-0001',
    complaintId: 'complaint-2052',
    technicianId: 'tech-usman',
    status: 'IN_PROGRESS',
    createdAt: '2026-08-08T10:00:00.000Z',
    updatedAt: '2026-08-08T13:30:00.000Z',
    completedAt: null,
  },
  {
    id: 'work-order-0002',
    assignmentId: 'assignment-0002',
    complaintId: 'complaint-historical-ali',
    technicianId: 'tech-ali',
    status: 'COMPLETED',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T12:30:00.000Z',
    completedAt: '2026-08-01T12:30:00.000Z',
  },
];
