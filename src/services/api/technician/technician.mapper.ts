import type {
  AssignedTechnician,
  TechnicianAssignment,
  WorkOrderTracking,
} from '@/services/support/models';
import type {
  AssignedTechnicianDto,
  TechnicianStatusDto,
} from './technician.models';

function mapStatus(status: TechnicianStatusDto): AssignedTechnician['status'] {
  switch (status) {
    case 'AVAILABLE':
      return 'available';
    case 'BUSY':
      return 'busy';
    case 'OFFLINE':
      return 'offline';
    case 'ON_LEAVE':
      return 'on_leave';
    case 'INACTIVE':
      return 'inactive';
  }
}

export function mapAssignedTechnicianDto(
  dto: AssignedTechnicianDto,
): AssignedTechnician {
  return {
    id: dto.id,
    name: dto.name,
    status: mapStatus(dto.status),
    skills: [...dto.skills],
    serviceArea: dto.serviceArea
      ? { city: dto.serviceArea.city, name: dto.serviceArea.name }
      : null,
  };
}

export function mapTechnicianAssignment(
  technician: AssignedTechnician,
  workOrder: WorkOrderTracking | undefined,
  fallbackAssignedAt: string,
): TechnicianAssignment {
  const status: TechnicianAssignment['status'] = workOrder
    ? workOrder.status === 'accepted'
      ? 'en_route'
      : workOrder.status === 'in_progress'
        ? 'working'
        : workOrder.status
    : 'assigned';
  const statusLabel = workOrder
    ? workOrder.status.replaceAll('_', ' ')
    : technician.status.replaceAll('_', ' ');
  return {
    technicianId: technician.id,
    technicianName: technician.name,
    status,
    assignedAt: workOrder?.assignedAt ?? fallbackAssignedAt,
    eta: statusLabel,
    skills: [...technician.skills],
    serviceArea: technician.serviceArea
      ? `${technician.serviceArea.name}, ${technician.serviceArea.city}`
      : null,
    workOrderId: workOrder?.id,
  };
}
