export type TechnicianStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_LEAVE';

export type WorkOrderStatus =
  'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TechnicianSkillDto = {
  id: string;
  name: string;
};

export type TechnicianAreaDto = {
  id: string;
  name: string;
  city: string;
};

export type TechnicianDto = {
  id: string;
  name: string;
  phone: string;
  status: TechnicianStatus;
  area: TechnicianAreaDto;
  skills: TechnicianSkillDto[];
  joinedAt: string;
};

export type TechnicianAssignmentDto = {
  id: string;
  complaintId: string;
  technicianId: string;
  workOrderId: string;
  assignedBy: string;
  assignedAt: string;
  endedAt: string | null;
};

export type TechnicianWorkOrderDto = {
  id: string;
  assignmentId: string;
  complaintId: string;
  technicianId: string;
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type TechnicianSkill = {
  id: string;
  name: string;
};

export type TechnicianArea = {
  id: string;
  name: string;
  city: string;
};

export type TechnicianAssignment = {
  id: string;
  complaintId: string;
  technicianId: string;
  assignedBy: string;
  assignedAt: string;
  endedAt: string | null;
  workOrder: {
    id: string;
    status: WorkOrderStatus;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  };
};

export type TechnicianWorkload = {
  technicianId: string;
  activeJobs: number;
  completedJobs: number;
  assignments: TechnicianAssignment[];
};

export type AdminTechnician = {
  id: string;
  name: string;
  phone: string;
  status: TechnicianStatus;
  area: TechnicianArea;
  skills: TechnicianSkill[];
  joinedAt: string;
  workload: Pick<TechnicianWorkload, 'activeJobs' | 'completedJobs'>;
};

export type TechnicianHistoryAction =
  | 'ASSIGNED'
  | 'REASSIGNED_FROM'
  | 'REASSIGNED_TO'
  | 'STATUS_CHANGED'
  | 'WORK_ORDER_COMPLETED'
  | 'WORK_ORDER_CANCELLED';

export type TechnicianHistory = {
  id: string;
  technicianId: string;
  complaintId: string | null;
  workOrderId: string | null;
  action: TechnicianHistoryAction;
  note: string;
  createdAt: string;
};

export type TechnicianFilters = {
  search?: string;
  status?: TechnicianStatus;
  areaId?: string;
};

export type AssignTechnicianComplaintInput = {
  complaintId: string;
  technicianId: string;
  assignedBy?: string;
};

export type ReassignTechnicianComplaintInput =
  AssignTechnicianComplaintInput & {
    reason?: string;
  };

export type UpdateTechnicianStatusInput = {
  id: string;
  status: TechnicianStatus;
};
