import type {
  Complaint,
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

const steps: { status: ComplaintStatus; description: string }[] = [
  { status: 'submitted', description: 'Your complaint was received.' },
  { status: 'assigned', description: 'A support specialist was assigned.' },
  {
    status: 'technician_working',
    description: 'Technician is investigating the issue.',
  },
  { status: 'resolved', description: 'Service restored and confirmed.' },
];

let complaints: ComplaintDetail[] = [
  {
    id: 'AMX-4821',
    category: 'speed',
    title: 'High latency during evening hours',
    description: 'Video calls and gaming become unstable after 7 PM.',
    status: 'technician_working',
    createdAt: '2026-08-04T10:30:00.000Z',
    updatedAt: '2026-08-06T08:45:00.000Z',
    expectedResolution: 'Today, 6:00 PM',
    timeline: steps.map((step, index) => ({
      ...step,
      completed: index < 3,
      timestamp:
        index < 3
          ? ['4 Aug, 10:30 AM', '4 Aug, 11:15 AM', '6 Aug, 8:45 AM'][index]
          : undefined,
    })),
    technician: {
      technicianName: 'Hamza Khan',
      status: 'working',
      assignedAt: '4 Aug, 11:15 AM',
      eta: 'On site · work in progress',
      phone: '+92 300 111 2479',
    },
  },
  {
    id: 'AMX-4695',
    category: 'router',
    title: 'Router disconnecting intermittently',
    description: 'The router restarted several times during the day.',
    status: 'resolved',
    createdAt: '2026-07-26T09:10:00.000Z',
    updatedAt: '2026-07-27T14:20:00.000Z',
    expectedResolution: 'Resolved 27 July',
    timeline: steps.map((step, index) => ({
      ...step,
      completed: true,
      timestamp: [
        '26 Jul, 9:10 AM',
        '26 Jul, 9:42 AM',
        '27 Jul, 11:00 AM',
        '27 Jul, 2:20 PM',
      ][index],
    })),
    technician: {
      technicianName: 'Adeel Ahmed',
      status: 'completed',
      assignedAt: '26 Jul, 9:42 AM',
      eta: 'Visit completed',
    },
    resolution:
      'Router firmware was updated and the connection remained stable after monitoring.',
  },
];

const wait = (duration = 360) =>
  new Promise<void>(resolve => setTimeout(resolve, duration));
const copy = (complaint: ComplaintDetail): ComplaintDetail => ({
  ...complaint,
  attachments: complaint.attachments?.map(item => ({ ...item })),
  timeline: complaint.timeline.map(item => ({ ...item })),
  technician: complaint.technician ? { ...complaint.technician } : undefined,
});

export const supportService: SupportService = {
  async getComplaints(connectionId) {
    void connectionId;
    await wait();
    return complaints.map(copy);
  },
  async createComplaint(connectionId, input) {
    void connectionId;
    await wait(650);
    const now = new Date().toISOString();
    const complaint: ComplaintDetail = {
      ...input,
      attachments: input.attachments?.map(item => ({ ...item })),
      id: `AMX-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      expectedResolution: 'Within 24 hours',
      timeline: steps.map((step, index) => ({
        ...step,
        completed: index === 0,
        timestamp: index === 0 ? 'Just now' : undefined,
      })),
    };
    complaints = [complaint, ...complaints];
    return copy(complaint);
  },
  async getComplaintDetail(connectionId, id) {
    void connectionId;
    await wait();
    const complaint = complaints.find(item => item.id === id);
    return complaint ? copy(complaint) : undefined;
  },
  async getCategories() {
    await wait(120);
    return categories.map(category => ({ ...category }));
  },
};

export const getComplaints = (connectionId: string) =>
  supportService.getComplaints(connectionId);
export const createComplaint = (
  connectionId: string,
  complaint: CreateComplaintInput,
) => supportService.createComplaint(connectionId, complaint);
export const getComplaintDetail = (connectionId: string, id: string) =>
  supportService.getComplaintDetail(connectionId, id);
