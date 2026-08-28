export type ComplaintCategory = 'internet' | 'speed' | 'router' | 'billing';

export type ComplaintStatus =
  'submitted' | 'assigned' | 'technician_working' | 'resolved';

export type AttachmentType = 'image' | 'video' | 'voice';

export interface ComplaintAttachment {
  id: string;
  type: AttachmentType;
  uri: string;
  name?: string;
}

export interface Complaint {
  id: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  expectedResolution?: string;
  attachments?: ComplaintAttachment[];
  workOrderId?: string;
}

export interface ComplaintTimeline {
  status: ComplaintStatus;
  timestamp?: string;
  description: string;
  completed: boolean;
}

export type DiagnosticState = 'connected' | 'healthy' | 'high' | 'offline';

export interface DiagnosticResult {
  internetStatus: DiagnosticState;
  routerStatus: DiagnosticState;
  networkStatus: DiagnosticState;
  latencyStatus: DiagnosticState;
  latencyMs: number;
  recommendation: string;
  checkedAt: string;
}

export interface TechnicianAssignment {
  technicianId: string;
  technicianName: string;
  status: 'assigned' | 'en_route' | 'working' | 'completed' | 'cancelled';
  assignedAt: string;
  eta: string;
  skills: string[];
  serviceArea: string | null;
  workOrderId?: string;
}

export interface AssignedTechnician {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline' | 'on_leave' | 'inactive';
  skills: string[];
  serviceArea: { city: string; name: string } | null;
}

export interface WorkOrderTracking {
  id: string;
  complaintId: string;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  technician: {
    id: string;
    name: string;
    status: AssignedTechnician['status'];
  };
  assignedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface SupportCategory {
  id: ComplaintCategory;
  name: string;
  icon:
    | 'cloud-offline-outline'
    | 'speedometer-outline'
    | 'hardware-chip-outline'
    | 'receipt-outline';
  priority: number;
}

export interface ComplaintDetail extends Complaint {
  timeline: ComplaintTimeline[];
  technician?: TechnicianAssignment;
  resolution?: string;
}

export interface CreateComplaintInput {
  category: ComplaintCategory;
  title: string;
  description: string;
  attachments?: ComplaintAttachment[];
}
