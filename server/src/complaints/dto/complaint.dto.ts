import { ComplaintPriority, ComplaintStatus, Prisma } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateComplaintDto {
  @IsUUID('4')
  customerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attachmentUrl?: string;
}

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class AssignTechnicianDto {
  @IsUUID('4')
  technicianId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export const complaintInclude = {
  customer: { select: { id: true, userId: true, name: true } },
  history: { orderBy: { occurredAt: 'asc' as const } },
  assignments: {
    include: {
      technician: {
        select: { id: true, name: true, phone: true, status: true },
      },
      assignedBy: { select: { id: true, name: true } },
      workOrder: { select: { id: true, number: true, status: true } },
    },
    orderBy: { assignedAt: 'asc' as const },
  },
  workOrders: {
    select: {
      id: true,
      number: true,
      technicianId: true,
      status: true,
      assignedAt: true,
      acceptedAt: true,
      startedAt: true,
      completedAt: true,
      cancelledAt: true,
      notes: true,
    },
    orderBy: { assignedAt: 'asc' as const },
  },
} satisfies Prisma.ComplaintInclude;

export type ComplaintRecord = Prisma.ComplaintGetPayload<{
  include: typeof complaintInclude;
}>;

export class ComplaintResponseDto {
  readonly id!: string;
  readonly ticketNumber!: number;
  readonly customerId!: string;
  readonly category!: string;
  readonly priority!: ComplaintPriority;
  readonly description!: string;
  readonly attachmentUrl!: string | null;
  readonly status!: ComplaintStatus;
  readonly resolvedAt!: Date | null;
  readonly closedAt!: Date | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly customer!: ComplaintRecord['customer'];
  readonly history!: ComplaintRecord['history'];
  readonly assignments!: ComplaintRecord['assignments'];
  readonly workOrders!: ComplaintRecord['workOrders'];

  constructor(record: ComplaintRecord) {
    Object.assign(this, record);
  }
}
