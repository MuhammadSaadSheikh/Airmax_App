import { mockComplaints, mockComplaintTechnicians } from './complaints.mock';
import type {
  ApiComplaintStatus,
  AssignComplaintInput,
  ComplaintDto,
  CreateComplaintRepositoryInput,
  ReplyToComplaintInput,
  TechnicianDto,
  UpdateComplaintStatusInput,
} from './complaints.models';
import { mapComplaintStatusToDto } from './complaints.mapper';

const flow: ApiComplaintStatus[] = [
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

let complaintsState = cloneComplaints(mockComplaints);
let nextComplaintNumber = 3000;

function cloneComplaint(complaint: ComplaintDto): ComplaintDto {
  return {
    ...complaint,
    user: { ...complaint.user },
    technician: complaint.technician ? { ...complaint.technician } : null,
    events: complaint.events.map(event => ({ ...event })),
  };
}

function cloneComplaints(complaints: ComplaintDto[]): ComplaintDto[] {
  return complaints.map(cloneComplaint);
}

function cloneTechnician(technician: TechnicianDto): TechnicianDto {
  return {
    ...technician,
    area: technician.area ? { ...technician.area } : null,
    _count: { ...technician._count },
  };
}

function complaintIndex(id: string): number {
  const index = complaintsState.findIndex(complaint => complaint.id === id);
  if (index < 0) throw new Error('Complaint not found');
  return index;
}

function mutableComplaint(id: string): [number, ComplaintDto] {
  const index = complaintIndex(id);
  return [index, complaintsState[index]!];
}

function assertOpen(complaint: ComplaintDto) {
  if (complaint.status === 'CLOSED') {
    throw new Error('Closed complaints cannot be modified');
  }
}

function statusEvent(
  complaint: ComplaintDto,
  status: ApiComplaintStatus,
  createdAt: string,
  note: string | null = null,
) {
  return {
    id: `mock-event-${complaint.id}-${complaint.events.length + 1}`,
    complaintId: complaint.id,
    status,
    note,
    actorId: 'admin-mock',
    createdAt,
  };
}

export const mockComplaintRepository = {
  list(): ComplaintDto[] {
    return cloneComplaints(complaintsState);
  },

  getById(id: string): ComplaintDto | undefined {
    const complaint = complaintsState.find(item => item.id === id);
    return complaint ? cloneComplaint(complaint) : undefined;
  },

  technicians(): TechnicianDto[] {
    return mockComplaintTechnicians.map(technician =>
      cloneTechnician({
        ...technician,
        _count: {
          complaints: complaintsState.filter(
            complaint =>
              complaint.technicianId === technician.id &&
              complaint.status !== 'RESOLVED' &&
              complaint.status !== 'CLOSED',
          ).length,
        },
      }),
    );
  },

  create(input: CreateComplaintRepositoryInput): ComplaintDto {
    const timestamp = new Date().toISOString();
    const ticketNumber = nextComplaintNumber++;
    const complaint: ComplaintDto = {
      id: `mock-complaint-${ticketNumber}`,
      ticketNumber,
      userId: input.customerId,
      category: input.category,
      title: input.title,
      description: input.description,
      attachmentUrl: input.attachmentUrl,
      status: 'PENDING',
      technicianId: null,
      adminReply: null,
      user: { ...input.customer },
      technician: null,
      events: [
        {
          id: `mock-event-${ticketNumber}-1`,
          complaintId: `mock-complaint-${ticketNumber}`,
          status: 'PENDING',
          note: 'Complaint submitted by customer',
          actorId: input.customerId,
          createdAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
    };
    complaintsState = [complaint, ...complaintsState];
    return cloneComplaint(complaint);
  },

  assign(input: AssignComplaintInput): ComplaintDto {
    const [index, complaint] = mutableComplaint(input.complaintId);
    assertOpen(complaint);
    const technician = mockComplaintTechnicians.find(
      item => item.id === input.technicianId,
    );
    if (!technician) throw new Error('Technician not found');

    const updatedAt = new Date().toISOString();
    const status =
      complaint.status === 'PENDING' ? 'ASSIGNED' : complaint.status;
    const assignmentNote = complaint.technicianId
      ? `Reassigned to ${technician.name}`
      : `Assigned to ${technician.name}`;
    const updated: ComplaintDto = {
      ...complaint,
      technicianId: technician.id,
      technician: cloneTechnician(technician),
      status,
      updatedAt,
      events: [
        ...complaint.events,
        statusEvent(complaint, status, updatedAt, assignmentNote),
      ],
    };
    complaintsState[index] = updated;
    return cloneComplaint(updated);
  },

  updateStatus(input: UpdateComplaintStatusInput): ComplaintDto {
    const [index, complaint] = mutableComplaint(input.complaintId);
    assertOpen(complaint);
    const status = mapComplaintStatusToDto(input.status);
    const currentIndex = flow.indexOf(complaint.status);
    if (flow[currentIndex + 1] !== status) {
      throw new Error('Complaint status must follow the approved workflow');
    }
    if (status === 'ASSIGNED' && !complaint.technicianId) {
      throw new Error('Assign a technician before updating this complaint');
    }

    const updatedAt = new Date().toISOString();
    const updated: ComplaintDto = {
      ...complaint,
      status,
      updatedAt,
      resolvedAt: status === 'RESOLVED' ? updatedAt : complaint.resolvedAt,
      events: [...complaint.events, statusEvent(complaint, status, updatedAt)],
    };
    complaintsState[index] = updated;
    return cloneComplaint(updated);
  },

  reply(input: ReplyToComplaintInput): ComplaintDto {
    const [index, complaint] = mutableComplaint(input.complaintId);
    assertOpen(complaint);
    const reply = input.reply.trim();
    if (!reply) throw new Error('Admin reply cannot be empty');

    const updatedAt = new Date().toISOString();
    const updated: ComplaintDto = {
      ...complaint,
      adminReply: reply,
      updatedAt,
      events: [
        ...complaint.events,
        statusEvent(
          complaint,
          complaint.status,
          updatedAt,
          `Admin reply: ${reply}`,
        ),
      ],
    };
    complaintsState[index] = updated;
    return cloneComplaint(updated);
  },

  reset(): void {
    complaintsState = cloneComplaints(mockComplaints);
    nextComplaintNumber = 3000;
  },
};
