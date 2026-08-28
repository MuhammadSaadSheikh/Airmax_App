import type { WorkOrderTracking } from '@/services/support/models';
import type { TechnicianStatusDto } from '../technician/technician.models';

export type WorkOrderStatusDto =
  'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type WorkOrderDto = {
  id: string;
  complaintId: string;
  status: WorkOrderStatusDto;
  technician: {
    id: string;
    name: string;
    status: TechnicianStatusDto;
  };
  assignedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export interface WorkOrderTrackingApiService {
  getWorkOrderById(id: string): Promise<WorkOrderTracking>;
}
