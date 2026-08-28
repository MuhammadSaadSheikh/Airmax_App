import {
  ComplaintPriority,
  ComplaintStatus,
  Prisma,
  TechnicianAssignmentStatus,
  TechnicianStatus,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateComplaintDto {
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @ValidateIf(input => !input.customerId || input.priority !== undefined)
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

export const complaintTechnicianSelect = {
  customer: { select: { userId: true } },
  assignments: {
    where: { status: { not: TechnicianAssignmentStatus.CANCELLED } },
    orderBy: { assignedAt: 'desc' as const },
    take: 1,
    select: {
      technician: {
        select: {
          id: true,
          name: true,
          status: true,
          skills: {
            select: { skill: { select: { name: true } } },
            orderBy: { createdAt: 'asc' as const },
          },
          serviceArea: { select: { city: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.ComplaintSelect;

export type ComplaintTechnicianLookup = Prisma.ComplaintGetPayload<{
  select: typeof complaintTechnicianSelect;
}>;

type ComplaintTechnicianRecord =
  ComplaintTechnicianLookup['assignments'][number]['technician'];

export class ComplaintTechnicianResponseDto {
  readonly id: string;
  readonly name: string;
  readonly status: TechnicianStatus;
  readonly skills: string[];
  readonly serviceArea: { city: string; name: string } | null;

  constructor(record: ComplaintTechnicianRecord) {
    this.id = record.id;
    this.name = record.name;
    this.status = record.status;
    this.skills = record.skills.map(({ skill }) => skill.name);
    this.serviceArea = record.serviceArea
      ? { city: record.serviceArea.city, name: record.serviceArea.name }
      : null;
  }
}

export class ComplaintResponseDto {
  readonly id!: string;
  readonly ticketNumber!: number;
  readonly customerId!: string;
  readonly category!: string;
  readonly title!: string | null;
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
    this.title = record.title ?? null;
  }
}
