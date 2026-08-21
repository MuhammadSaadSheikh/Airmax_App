export type ApiComplaintStatus =
  'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type ApiTechnicianStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type ComplaintCustomerDto = {
  name: string;
  phone: string;
  connectionId: string | null;
};

export type ComplaintTechnicianDto = {
  id: string;
  name: string;
  phone: string;
  areaId: string | null;
  status: ApiTechnicianStatus;
};

export type ComplaintEventDto = {
  id: string;
  complaintId: string;
  status: ApiComplaintStatus;
  note: string | null;
  actorId: string;
  createdAt: string;
};

export type ComplaintDto = {
  id: string;
  ticketNumber: number;
  userId: string;
  category: string;
  title: string;
  description: string;
  attachmentUrl: string | null;
  status: ApiComplaintStatus;
  technicianId: string | null;
  adminReply: string | null;
  user: ComplaintCustomerDto;
  technician: ComplaintTechnicianDto | null;
  events: ComplaintEventDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type TechnicianDto = ComplaintTechnicianDto & {
  area: { id: string; city: string; name: string } | null;
  _count: { complaints: number };
};

export type UpdateComplaintDto = {
  status?: ApiComplaintStatus;
  technicianId?: string;
  adminReply?: string;
};

export type AdminComplaintStatus =
  'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export type AdminTechnicianStatus = 'available' | 'busy' | 'offline';

export type AdminComplaintCustomer = {
  name: string;
  phone: string;
  connectionId: string | null;
};

export type AdminComplaintTechnician = {
  id: string;
  name: string;
  phone: string;
  status: AdminTechnicianStatus;
};

export type AdminComplaintEvent = {
  id: string;
  status: AdminComplaintStatus;
  note: string | null;
  actorId: string;
  createdAt: string;
};

export type AdminComplaint = {
  id: string;
  ticketNumber: number;
  customer: AdminComplaintCustomer;
  category: string;
  description: string;
  attachmentUrl: string | null;
  status: AdminComplaintStatus;
  technician: AdminComplaintTechnician | null;
  adminReply: string | null;
  events: AdminComplaintEvent[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type AdminTechnicianOption = AdminComplaintTechnician & {
  areaName: string | null;
  complaintCount: number;
};

export type ComplaintStatusFilter = AdminComplaintStatus | 'all';

export type AssignComplaintInput = {
  complaintId: string;
  technicianId: string;
};

export type UpdateComplaintStatusInput = {
  complaintId: string;
  status: AdminComplaintStatus;
};

export type ReplyToComplaintInput = {
  complaintId: string;
  reply: string;
};

export type CreateComplaintRepositoryInput = {
  customerId: string;
  customer: ComplaintCustomerDto;
  category: string;
  title: string;
  description: string;
  attachmentUrl: string | null;
};
