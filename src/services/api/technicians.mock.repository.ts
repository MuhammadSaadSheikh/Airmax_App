import {
  mockTechnicianAssignments,
  mockTechnicians,
  mockTechnicianWorkOrders,
} from './technicians.mock';
import type {
  ReassignTechnicianComplaintInput,
  TechnicianAssignmentDto,
  TechnicianDto,
  TechnicianHistory,
  TechnicianHistoryAction,
  TechnicianWorkOrderDto,
  UpdateTechnicianStatusInput,
  WorkOrderStatus,
} from './technicians.models';

type AssignmentInput = {
  complaintId: string;
  technicianId: string;
  assignedBy?: string;
};

type RepositorySnapshot = {
  technicians: TechnicianDto[];
  assignments: TechnicianAssignmentDto[];
  workOrders: TechnicianWorkOrderDto[];
  history: TechnicianHistory[];
};

const activeStatuses: readonly WorkOrderStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
];

const cloneTechnician = (item: TechnicianDto): TechnicianDto => ({
  ...item,
  area: { ...item.area },
  skills: item.skills.map(skill => ({ ...skill })),
});
const cloneAssignment = (
  item: TechnicianAssignmentDto,
): TechnicianAssignmentDto => ({ ...item });
const cloneWorkOrder = (
  item: TechnicianWorkOrderDto,
): TechnicianWorkOrderDto => ({ ...item });
const cloneHistory = (item: TechnicianHistory): TechnicianHistory => ({
  ...item,
});

let techniciansState: TechnicianDto[] = [];
let assignmentsState: TechnicianAssignmentDto[] = [];
let workOrdersState: TechnicianWorkOrderDto[] = [];
let historyState: TechnicianHistory[] = [];
let nextAssignmentNumber = 3;
let nextWorkOrderNumber = 3;
let nextHistoryNumber = 1;
let nextTimestampNumber = 0;

function timestamp(): string {
  const value = new Date('2026-08-21T09:00:00.000Z');
  value.setSeconds(value.getSeconds() + nextTimestampNumber++);
  return value.toISOString();
}

function technicianIndex(id: string): number {
  const index = techniciansState.findIndex(item => item.id === id);
  if (index < 0) throw new Error('Technician not found');
  return index;
}

function technicianById(id: string): TechnicianDto {
  return techniciansState[technicianIndex(id)]!;
}

function workOrderIndex(id: string): number {
  const index = workOrdersState.findIndex(item => item.id === id);
  if (index < 0) throw new Error('Work order not found');
  return index;
}

function workOrderById(id: string): TechnicianWorkOrderDto {
  return workOrdersState[workOrderIndex(id)]!;
}

function workOrderForAssignment(
  assignment: TechnicianAssignmentDto,
): TechnicianWorkOrderDto {
  const workOrder = workOrdersState.find(
    item => item.id === assignment.workOrderId,
  );
  if (!workOrder) throw new Error('Assignment work order not found');
  return workOrder;
}

function activeAssignmentForComplaint(
  complaintId: string,
): TechnicianAssignmentDto | undefined {
  return assignmentsState.find(
    assignment =>
      assignment.complaintId === complaintId &&
      activeStatuses.includes(workOrderForAssignment(assignment).status),
  );
}

function activeCount(technicianId: string): number {
  return workOrdersState.filter(
    item =>
      item.technicianId === technicianId &&
      activeStatuses.includes(item.status),
  ).length;
}

function assertComplaintId(complaintId: string): void {
  if (!complaintId.trim()) throw new Error('Complaint is required');
}

function assertReceivesWork(technician: TechnicianDto): void {
  if (technician.status === 'OFFLINE') {
    throw new Error('Offline technician cannot receive work');
  }
  if (technician.status === 'ON_LEAVE') {
    throw new Error('Technician on leave cannot receive work');
  }
  if (activeCount(technician.id) >= technician.capacity) {
    throw new Error('Technician capacity exceeded');
  }
  if (technician.status === 'BUSY') {
    throw new Error('Busy technician cannot receive new work');
  }
}

function assertTransition(
  workOrder: TechnicianWorkOrderDto,
  status: WorkOrderStatus,
): void {
  if (workOrder.status === 'COMPLETED') {
    throw new Error('Completed work orders are immutable');
  }
  if (workOrder.status === 'CANCELLED') {
    throw new Error('Cancelled work orders cannot continue');
  }
  const nextStatus: Partial<Record<WorkOrderStatus, WorkOrderStatus>> = {
    ASSIGNED: 'ACCEPTED',
    ACCEPTED: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
  };
  const cancellationAllowed =
    status === 'CANCELLED' && activeStatuses.includes(workOrder.status);
  if (!cancellationAllowed && nextStatus[workOrder.status] !== status) {
    throw new Error(
      `Invalid work order transition from ${workOrder.status} to ${status}`,
    );
  }
}

function historyForTransition(status: WorkOrderStatus): {
  action: TechnicianHistoryAction;
  note: string;
} {
  switch (status) {
    case 'ACCEPTED':
      return { action: 'WORK_ORDER_ACCEPTED', note: 'Work order accepted' };
    case 'IN_PROGRESS':
      return { action: 'WORK_ORDER_STARTED', note: 'Work order started' };
    case 'COMPLETED':
      return { action: 'WORK_ORDER_COMPLETED', note: 'Work order completed' };
    case 'CANCELLED':
      return { action: 'WORK_ORDER_CANCELLED', note: 'Work order cancelled' };
    case 'ASSIGNED':
      throw new Error('Assigned is not a transition target');
  }
}

function addHistory(
  technicianId: string,
  action: TechnicianHistoryAction,
  note: string,
  createdAt: string,
  complaintId: string | null = null,
  workOrderId: string | null = null,
): void {
  historyState.unshift({
    id: `technician-history-${String(nextHistoryNumber++).padStart(4, '0')}`,
    technicianId,
    complaintId,
    workOrderId,
    action,
    note,
    createdAt,
  });
}

function setStatusAfterWorkChange(technicianId: string): void {
  const index = technicianIndex(technicianId);
  const technician = techniciansState[index]!;
  if (technician.status === 'OFFLINE' || technician.status === 'ON_LEAVE')
    return;
  techniciansState[index] = {
    ...technician,
    status: activeCount(technicianId) > 0 ? 'BUSY' : 'AVAILABLE',
  };
}

function createAssignment(input: AssignmentInput, createdAt: string) {
  const assignmentId = `assignment-${String(nextAssignmentNumber++).padStart(4, '0')}`;
  const workOrderId = `work-order-${String(nextWorkOrderNumber++).padStart(4, '0')}`;
  const assignment: TechnicianAssignmentDto = {
    id: assignmentId,
    complaintId: input.complaintId,
    technicianId: input.technicianId,
    workOrderId,
    assignedBy: input.assignedBy ?? 'admin-mock',
    assignedAt: createdAt,
    endedAt: null,
  };
  const workOrder: TechnicianWorkOrderDto = {
    id: workOrderId,
    assignmentId,
    complaintId: input.complaintId,
    technicianId: input.technicianId,
    status: 'ASSIGNED',
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  };
  assignmentsState.push(assignment);
  workOrdersState.push(workOrder);
  setStatusAfterWorkChange(input.technicianId);
  return { assignment, workOrder };
}

function seedHistory(): TechnicianHistory[] {
  return [
    {
      id: 'technician-history-seed-0002',
      technicianId: 'tech-ali',
      complaintId: 'complaint-2051',
      workOrderId: 'work-order-0002',
      action: 'WORK_ORDER_COMPLETED',
      note: 'Work order completed',
      createdAt: '2026-08-01T12:30:00.000Z',
    },
    {
      id: 'technician-history-seed-0001',
      technicianId: 'tech-usman',
      complaintId: 'complaint-2052',
      workOrderId: 'work-order-0001',
      action: 'ASSIGNED',
      note: 'Complaint assigned',
      createdAt: '2026-08-08T10:00:00.000Z',
    },
  ];
}

export const mockTechnicianRepository = {
  listTechnicians(): TechnicianDto[] {
    return techniciansState.map(cloneTechnician);
  },

  getTechnicianById(id: string): TechnicianDto | undefined {
    const technician = techniciansState.find(item => item.id === id);
    return technician ? cloneTechnician(technician) : undefined;
  },

  getAssignments(id: string): TechnicianAssignmentDto[] {
    technicianById(id);
    return assignmentsState
      .filter(item => item.technicianId === id)
      .map(cloneAssignment);
  },

  getWorkOrders(id: string): TechnicianWorkOrderDto[] {
    technicianById(id);
    return workOrdersState
      .filter(item => item.technicianId === id)
      .map(cloneWorkOrder);
  },

  getWorkOrderById(id: string): TechnicianWorkOrderDto | undefined {
    const workOrder = workOrdersState.find(item => item.id === id);
    return workOrder ? cloneWorkOrder(workOrder) : undefined;
  },

  getActiveWorkOrderForComplaint(
    complaintId: string,
  ): TechnicianWorkOrderDto | undefined {
    const assignment = activeAssignmentForComplaint(complaintId);
    return assignment
      ? cloneWorkOrder(workOrderForAssignment(assignment))
      : undefined;
  },

  getHistory(id: string): TechnicianHistory[] {
    technicianById(id);
    return historyState
      .filter(item => item.technicianId === id)
      .map(cloneHistory);
  },

  validateAssignment(input: AssignmentInput): void {
    assertComplaintId(input.complaintId);
    const technician = technicianById(input.technicianId);
    assertReceivesWork(technician);
    if (activeAssignmentForComplaint(input.complaintId)) {
      throw new Error('Complaint already has an active work order');
    }
    const completed = assignmentsState.find(
      assignment =>
        assignment.complaintId === input.complaintId &&
        workOrderForAssignment(assignment).status === 'COMPLETED',
    );
    if (completed) throw new Error('Completed work orders are immutable');
  },

  validateReassignment(input: ReassignTechnicianComplaintInput): void {
    assertComplaintId(input.complaintId);
    const current = activeAssignmentForComplaint(input.complaintId);
    if (!current) throw new Error('Active work order not found');
    if (current.technicianId === input.technicianId) {
      throw new Error('Complaint is already assigned to this technician');
    }
    assertReceivesWork(technicianById(input.technicianId));
  },

  assign(input: AssignmentInput): TechnicianAssignmentDto {
    this.validateAssignment(input);
    const createdAt = timestamp();
    const { assignment, workOrder } = createAssignment(input, createdAt);
    addHistory(
      input.technicianId,
      'ASSIGNED',
      'Complaint assigned',
      createdAt,
      input.complaintId,
      workOrder.id,
    );
    return cloneAssignment(assignment);
  },

  reassign(input: ReassignTechnicianComplaintInput): TechnicianAssignmentDto {
    this.validateReassignment(input);
    const current = activeAssignmentForComplaint(input.complaintId)!;
    const currentWorkOrder = workOrderForAssignment(current);
    if (currentWorkOrder.status === 'COMPLETED') {
      throw new Error('Completed work orders are immutable');
    }
    const changedAt = timestamp();
    current.endedAt = changedAt;
    currentWorkOrder.status = 'CANCELLED';
    currentWorkOrder.updatedAt = changedAt;
    const reason = input.reason?.trim() || 'Complaint reassigned';
    addHistory(
      current.technicianId,
      'REASSIGNED_FROM',
      reason,
      changedAt,
      input.complaintId,
      currentWorkOrder.id,
    );
    setStatusAfterWorkChange(current.technicianId);

    const { assignment, workOrder } = createAssignment(input, changedAt);
    addHistory(
      input.technicianId,
      'REASSIGNED_TO',
      reason,
      changedAt,
      input.complaintId,
      workOrder.id,
    );
    return cloneAssignment(assignment);
  },

  validateWorkOrderTransition(id: string, status: WorkOrderStatus): void {
    assertTransition(workOrderById(id), status);
  },

  transitionWorkOrder(
    id: string,
    status: WorkOrderStatus,
  ): TechnicianWorkOrderDto {
    const index = workOrderIndex(id);
    const workOrder = workOrdersState[index]!;
    assertTransition(workOrder, status);
    const changedAt = timestamp();
    const terminal = status === 'COMPLETED' || status === 'CANCELLED';
    const updated: TechnicianWorkOrderDto = {
      ...workOrder,
      status,
      updatedAt: changedAt,
      completedAt: status === 'COMPLETED' ? changedAt : null,
    };
    workOrdersState[index] = updated;
    if (terminal) {
      const assignment = assignmentsState.find(
        item => item.id === workOrder.assignmentId,
      );
      if (!assignment) throw new Error('Work order assignment not found');
      assignment.endedAt = changedAt;
    }
    const history = historyForTransition(status);
    addHistory(
      workOrder.technicianId,
      history.action,
      history.note,
      changedAt,
      workOrder.complaintId,
      workOrder.id,
    );
    setStatusAfterWorkChange(workOrder.technicianId);
    return cloneWorkOrder(updated);
  },

  synchronizeResolvedComplaint(
    complaintId: string,
  ): TechnicianWorkOrderDto | undefined {
    let workOrder = this.getActiveWorkOrderForComplaint(complaintId);
    if (!workOrder) return undefined;
    if (workOrder.status === 'ASSIGNED') {
      workOrder = this.transitionWorkOrder(workOrder.id, 'ACCEPTED');
    }
    if (workOrder.status === 'ACCEPTED') {
      workOrder = this.transitionWorkOrder(workOrder.id, 'IN_PROGRESS');
    }
    if (workOrder.status === 'IN_PROGRESS') {
      workOrder = this.transitionWorkOrder(workOrder.id, 'COMPLETED');
    }
    return cloneWorkOrder(workOrder);
  },

  updateStatus(input: UpdateTechnicianStatusInput): TechnicianDto {
    const index = technicianIndex(input.id);
    const technician = techniciansState[index]!;
    if (technician.status === input.status) return cloneTechnician(technician);
    if (input.status === 'AVAILABLE' && activeCount(input.id) > 0) {
      throw new Error('Technician with active work cannot be marked available');
    }
    const changedAt = timestamp();
    techniciansState[index] = { ...technician, status: input.status };
    addHistory(
      input.id,
      'STATUS_CHANGED',
      `Status changed from ${technician.status} to ${input.status}`,
      changedAt,
    );
    return cloneTechnician(techniciansState[index]!);
  },

  snapshot(): RepositorySnapshot {
    return {
      technicians: techniciansState.map(cloneTechnician),
      assignments: assignmentsState.map(cloneAssignment),
      workOrders: workOrdersState.map(cloneWorkOrder),
      history: historyState.map(cloneHistory),
    };
  },

  reset(): void {
    techniciansState = mockTechnicians.map(cloneTechnician);
    assignmentsState = mockTechnicianAssignments.map(cloneAssignment);
    workOrdersState = mockTechnicianWorkOrders.map(cloneWorkOrder);
    historyState = seedHistory();
    nextAssignmentNumber = 3;
    nextWorkOrderNumber = 3;
    nextHistoryNumber = 1;
    nextTimestampNumber = 0;
  },
};

mockTechnicianRepository.reset();
