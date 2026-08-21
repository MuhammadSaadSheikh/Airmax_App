import { mockComplaintRepository } from '@/services/api/complaints.mock.repository';
import type {
  ApiComplaintStatus,
  ComplaintDto,
} from '@/services/api/complaints.models';
import { resolveMockCustomer } from '@/services/api/mockCustomerContext';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintDetail,
  ComplaintStatus,
  CreateComplaintInput,
  SupportCategory,
} from './models';

export interface SupportService {
  getComplaints(connectionId: string): Promise<Complaint[]>;
  createComplaint(
    connectionId: string,
    complaint: CreateComplaintInput,
  ): Promise<ComplaintDetail>;
  getComplaintDetail(
    connectionId: string,
    id: string,
  ): Promise<ComplaintDetail | undefined>;
  getCategories(): Promise<SupportCategory[]>;
}

const categories: SupportCategory[] = [
  {
    id: 'internet',
    name: 'No internet',
    icon: 'cloud-offline-outline',
    priority: 1,
  },
  { id: 'speed', name: 'Slow speed', icon: 'speedometer-outline', priority: 2 },
  {
    id: 'router',
    name: 'Router issue',
    icon: 'hardware-chip-outline',
    priority: 3,
  },
  {
    id: 'billing',
    name: 'Billing issue',
    icon: 'receipt-outline',
    priority: 4,
  },
];

const stages: Array<{ status: ComplaintStatus; description: string }> = [
  { status: 'submitted', description: 'Your complaint was received.' },
  { status: 'assigned', description: 'A support specialist was assigned.' },
  {
    status: 'technician_working',
    description: 'Technician is investigating the issue.',
  },
  { status: 'resolved', description: 'Service restored and confirmed.' },
];

const wait = (duration = 360) =>
  new Promise<void>(resolve => setTimeout(resolve, duration));

function customerStatus(status: ApiComplaintStatus): ComplaintStatus {
  if (status === 'PENDING') return 'submitted';
  if (status === 'ASSIGNED') return 'assigned';
  if (status === 'IN_PROGRESS') return 'technician_working';
  return 'resolved';
}

function customerCategory(category: string): ComplaintCategory {
  const normalized = category.toLowerCase();
  if (normalized.includes('speed')) return 'speed';
  if (normalized.includes('router')) return 'router';
  if (normalized.includes('bill')) return 'billing';
  return 'internet';
}

function stageApiStatus(status: ComplaintStatus): ApiComplaintStatus {
  if (status === 'submitted') return 'PENDING';
  if (status === 'assigned') return 'ASSIGNED';
  if (status === 'technician_working') return 'IN_PROGRESS';
  return 'RESOLVED';
}

function mapComplaint(complaint: ComplaintDto): ComplaintDetail {
  const status = customerStatus(complaint.status);
  const currentIndex = stages.findIndex(stage => stage.status === status);
  return {
    id: complaint.id,
    category: customerCategory(complaint.category),
    title: complaint.title,
    description: complaint.description,
    status,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    expectedResolution:
      complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
        ? 'Resolved'
        : 'Within 24 hours',
    attachments: complaint.attachmentUrl
      ? [
          {
            id: `${complaint.id}-attachment-1`,
            type: 'image',
            uri: complaint.attachmentUrl,
          },
        ]
      : undefined,
    timeline: stages.map((stage, index) => {
      const apiStatus = stageApiStatus(stage.status);
      const event = complaint.events.find(item => item.status === apiStatus);
      return {
        ...stage,
        completed: index <= currentIndex,
        timestamp: event?.createdAt,
      };
    }),
    technician: complaint.technician
      ? {
          technicianName: complaint.technician.name,
          status:
            complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
              ? 'completed'
              : complaint.status === 'IN_PROGRESS'
                ? 'working'
                : 'assigned',
          assignedAt:
            complaint.events.find(event => event.status === 'ASSIGNED')
              ?.createdAt ?? complaint.updatedAt,
          eta:
            complaint.status === 'IN_PROGRESS'
              ? 'Work in progress'
              : 'Assigned',
          phone: complaint.technician.phone,
        }
      : undefined,
    resolution:
      complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
        ? (complaint.adminReply ?? 'Complaint resolved.')
        : undefined,
  };
}

function customerComplaints(customerId: string): ComplaintDto[] {
  return mockComplaintRepository
    .list()
    .filter(complaint => complaint.userId === customerId);
}

export const supportService: SupportService = {
  async getComplaints(connectionId) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    return customerComplaints(customer.id).map(mapComplaint);
  },

  async createComplaint(connectionId, input) {
    await wait(650);
    const customer = resolveMockCustomer(connectionId);
    return mapComplaint(
      mockComplaintRepository.create({
        customerId: customer.id,
        customer: {
          name: customer.name,
          phone: customer.phone,
          connectionId: customer.connectionId,
        },
        category:
          categories.find(category => category.id === input.category)?.name ??
          input.category,
        title: input.title,
        description: input.description,
        attachmentUrl: input.attachments?.[0]?.uri ?? null,
      }),
    );
  },

  async getComplaintDetail(connectionId, id) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    const complaint = mockComplaintRepository.getById(id);
    return complaint?.userId === customer.id
      ? mapComplaint(complaint)
      : undefined;
  },

  async getCategories() {
    await wait(180);
    return categories.map(category => ({ ...category }));
  },
};
