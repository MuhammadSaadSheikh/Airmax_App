import { Prisma, TechnicianStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTechnicianStatusDto {
  @IsEnum(TechnicianStatus)
  status!: TechnicianStatus;
}

export const technicianInclude = {
  serviceArea: true,
  skills: { include: { skill: true }, orderBy: { createdAt: 'asc' as const } },
  _count: { select: { assignments: true, workOrders: true } },
} satisfies Prisma.TechnicianInclude;

export type TechnicianRecord = Prisma.TechnicianGetPayload<{
  include: typeof technicianInclude;
}>;

export class TechnicianResponseDto {
  readonly id!: string;
  readonly employeeNumber!: string;
  readonly name!: string;
  readonly phone!: string;
  readonly serviceAreaId!: string | null;
  readonly status!: TechnicianStatus;
  readonly serviceArea!: TechnicianRecord['serviceArea'];
  readonly skills!: TechnicianRecord['skills'];
  readonly assignmentCount!: number;
  readonly workOrderCount!: number;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: TechnicianRecord) {
    const { _count, ...technician } = record;
    Object.assign(this, technician, {
      assignmentCount: _count.assignments,
      workOrderCount: _count.workOrders,
    });
  }
}
