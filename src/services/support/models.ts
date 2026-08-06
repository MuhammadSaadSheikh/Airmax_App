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
  technicianName: string;
  status: 'assigned' | 'en_route' | 'working' | 'completed';
  assignedAt: string;
  eta: string;
  phone?: string;
}

export interface SupportCategory {
  id: ComplaintCategory;
  name: string;
  icon: string;
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
