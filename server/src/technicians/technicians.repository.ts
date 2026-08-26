import { Injectable } from '@nestjs/common';
import {
  Prisma,
  TechnicianAssignmentStatus,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { technicianInclude } from './dto/technician.dto';

@Injectable()
export class TechniciansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.technician.findMany({
      include: technicianInclude,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.technician.findUnique({
      where: { id },
      include: technicianInclude,
    });
  }

  countActiveWork(id: string) {
    return this.prisma.workOrder.count({
      where: {
        technicianId: id,
        status: {
          in: [
            WorkOrderStatus.ASSIGNED,
            WorkOrderStatus.ACCEPTED,
            WorkOrderStatus.IN_PROGRESS,
          ],
        },
        assignment: {
          status: {
            in: [
              TechnicianAssignmentStatus.ASSIGNED,
              TechnicianAssignmentStatus.ACCEPTED,
              TechnicianAssignmentStatus.ACTIVE,
            ],
          },
        },
      },
    });
  }

  update(id: string, data: Prisma.TechnicianUpdateInput) {
    return this.prisma.technician.update({
      where: { id },
      data,
      include: technicianInclude,
    });
  }
}
