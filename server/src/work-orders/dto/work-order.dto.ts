import { Prisma, WorkOrderStatus } from '@prisma/client';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class WorkOrderActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export const workOrderInclude = {
  complaint: {
    select: { id: true, ticketNumber: true, status: true, customerId: true },
  },
  customer: { select: { id: true, userId: true, name: true } },
  technician: {
    select: { id: true, name: true, phone: true, status: true },
  },
  assignment: {
    select: {
      id: true,
      status: true,
      assignedById: true,
      assignedAt: true,
    },
  },
  history: { orderBy: { occurredAt: 'asc' as const } },
} satisfies Prisma.WorkOrderInclude;

export type WorkOrderRecord = Prisma.WorkOrderGetPayload<{
  include: typeof workOrderInclude;
}>;

export class WorkOrderResponseDto {
  readonly id!: string;
  readonly number!: string;
  readonly complaintId!: string;
  readonly customerId!: string;
  readonly technicianId!: string;
  readonly assignmentId!: string;
  readonly status!: WorkOrderStatus;
  readonly assignedAt!: Date;
  readonly acceptedAt!: Date | null;
  readonly startedAt!: Date | null;
  readonly completedAt!: Date | null;
  readonly cancelledAt!: Date | null;
  readonly notes!: string | null;
  readonly complaint!: WorkOrderRecord['complaint'];
  readonly customer!: WorkOrderRecord['customer'];
  readonly technician!: WorkOrderRecord['technician'];
  readonly assignment!: WorkOrderRecord['assignment'];
  readonly history!: WorkOrderRecord['history'];
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: WorkOrderRecord) {
    Object.assign(this, record);
  }
}
