import type {
  AdminComplaint,
  AdminComplaintStatus,
  AdminTechnicianOption,
  AdminTechnicianStatus,
  ApiComplaintStatus,
  ApiTechnicianStatus,
  ComplaintDto,
  TechnicianDto,
} from './complaints.models';

export function mapComplaintStatus(
  status: ApiComplaintStatus,
): AdminComplaintStatus {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'ASSIGNED':
      return 'assigned';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'RESOLVED':
      return 'resolved';
    case 'CLOSED':
      return 'closed';
  }
}

export function mapComplaintStatusToDto(
  status: AdminComplaintStatus,
): ApiComplaintStatus {
  switch (status) {
    case 'pending':
      return 'PENDING';
    case 'assigned':
      return 'ASSIGNED';
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'resolved':
      return 'RESOLVED';
    case 'closed':
      return 'CLOSED';
  }
}

function mapTechnicianStatus(
  status: ApiTechnicianStatus,
): AdminTechnicianStatus {
  switch (status) {
    case 'AVAILABLE':
      return 'available';
    case 'BUSY':
      return 'busy';
    case 'OFFLINE':
      return 'offline';
    case 'ON_LEAVE':
      return 'on_leave';
  }
}

export function mapComplaint(complaint: ComplaintDto): AdminComplaint {
  return {
    id: complaint.id,
    ticketNumber: complaint.ticketNumber,
    customer: { ...complaint.user },
    category: complaint.category,
    description: complaint.description,
    attachmentUrl: complaint.attachmentUrl,
    status: mapComplaintStatus(complaint.status),
    technician: complaint.technician
      ? {
          id: complaint.technician.id,
          name: complaint.technician.name,
          phone: complaint.technician.phone,
          status: mapTechnicianStatus(complaint.technician.status),
        }
      : null,
    adminReply: complaint.adminReply,
    events: complaint.events.map(event => ({
      id: event.id,
      status: mapComplaintStatus(event.status),
      note: event.note,
      actorId: event.actorId,
      createdAt: event.createdAt,
    })),
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    resolvedAt: complaint.resolvedAt,
  };
}

export function mapTechnician(
  technician: TechnicianDto,
): AdminTechnicianOption {
  return {
    id: technician.id,
    name: technician.name,
    phone: technician.phone,
    status: mapTechnicianStatus(technician.status),
    areaName: technician.area?.name ?? null,
    complaintCount: Math.max(0, technician._count.complaints),
  };
}
