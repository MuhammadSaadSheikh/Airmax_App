import type {
  Complaint,
  ComplaintDetail,
  CreateComplaintInput,
} from '@/services/support/models';

export type ComplaintPriorityDto = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ComplaintStatusDto =
  'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type ComplaintHistoryDto = {
  id: string;
  type: string;
  actorId: string | null;
  previousStatus: ComplaintStatusDto | null;
  currentStatus: ComplaintStatusDto | null;
  message: string | null;
  metadata: unknown;
  occurredAt: string;
};

export type ComplaintWorkOrderSummaryDto = {
  id: string;
  status: 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type ComplaintDto = {
  id: string;
  ticketNumber: number;
  customerId: string;
  category: string;
  title: string | null;
  priority: ComplaintPriorityDto;
  description: string;
  attachmentUrl: string | null;
  status: ComplaintStatusDto;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: ComplaintHistoryDto[];
  workOrders: ComplaintWorkOrderSummaryDto[];
};

export type CreateComplaintDto = {
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriorityDto;
};

export interface ComplaintApiService {
  getCustomerComplaints(customerId: string): Promise<Complaint[]>;
  getComplaintById(id: string): Promise<ComplaintDetail>;
  createComplaint(input: CreateComplaintInput): Promise<ComplaintDetail>;
}
