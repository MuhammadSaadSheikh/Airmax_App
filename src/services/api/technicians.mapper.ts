import type {
  AdminTechnician,
  TechnicianAssignment,
  TechnicianAssignmentDto,
  TechnicianDto,
  TechnicianWorkOrderDto,
  TechnicianWorkload,
} from './technicians.models';

export function mapTechnicianAssignment(
  assignment: TechnicianAssignmentDto,
  workOrder: TechnicianWorkOrderDto,
): TechnicianAssignment {
  return {
    id: assignment.id,
    complaintId: assignment.complaintId,
    technicianId: assignment.technicianId,
    assignedBy: assignment.assignedBy,
    assignedAt: assignment.assignedAt,
    endedAt: assignment.endedAt,
    workOrder: {
      id: workOrder.id,
      status: workOrder.status,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt,
      completedAt: workOrder.completedAt,
    },
  };
}

export function mapTechnicianWorkload(
  technicianId: string,
  capacity: number,
  assignments: TechnicianAssignmentDto[],
  workOrders: TechnicianWorkOrderDto[],
): TechnicianWorkload {
  const mapped = assignments.map(assignment => {
    const workOrder = workOrders.find(
      item => item.id === assignment.workOrderId,
    );
    if (!workOrder) throw new Error('Assignment work order not found');
    return mapTechnicianAssignment(assignment, workOrder);
  });
  const activeJobs = mapped.filter(item =>
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(item.workOrder.status),
  ).length;
  return {
    technicianId,
    capacity,
    activeJobs,
    availableCapacity: Math.max(0, capacity - activeJobs),
    completedJobs: mapped.filter(item => item.workOrder.status === 'COMPLETED')
      .length,
    assignments: mapped,
  };
}

export function mapTechnician(
  technician: TechnicianDto,
  workload: TechnicianWorkload,
): AdminTechnician {
  return {
    id: technician.id,
    name: technician.name,
    phone: technician.phone,
    status: technician.status,
    area: { ...technician.area },
    skills: technician.skills.map(skill => ({ ...skill })),
    capacity: technician.capacity,
    joinedAt: technician.joinedAt,
    workload: {
      activeJobs: workload.activeJobs,
      availableCapacity: workload.availableCapacity,
      completedJobs: workload.completedJobs,
    },
  };
}
