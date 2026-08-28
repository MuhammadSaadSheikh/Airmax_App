import type { WorkOrderTracking } from '@/services/support/models';
import { mapAssignedTechnicianDto } from '../technician/technician.mapper';
import type { WorkOrderDto } from './workOrder.models';

export function mapWorkOrderDto(dto: WorkOrderDto): WorkOrderTracking {
  const technician = mapAssignedTechnicianDto({
    ...dto.technician,
    skills: [],
    serviceArea: null,
  });
  return {
    id: dto.id,
    complaintId: dto.complaintId,
    status: dto.status.toLowerCase() as WorkOrderTracking['status'],
    technician: {
      id: technician.id,
      name: technician.name,
      status: technician.status,
    },
    assignedAt: dto.assignedAt,
    acceptedAt: dto.acceptedAt,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
  };
}
