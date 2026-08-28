import { Injectable } from '@nestjs/common';
import {
  ComplaintHistoryType,
  ComplaintStatus,
  Prisma,
  TechnicianAssignmentStatus,
  TechnicianStatus,
  WorkOrderHistoryType,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  complaintInclude,
  complaintTechnicianSelect,
} from './dto/complaint.dto';

const ACTIVE_ASSIGNMENTS = [
  TechnicianAssignmentStatus.ASSIGNED,
  TechnicianAssignmentStatus.ACCEPTED,
  TechnicianAssignmentStatus.ACTIVE,
];

@Injectable()
export class ComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomerById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  findById(id: string) {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: complaintInclude,
    });
  }

  findByCustomerId(customerId: string) {
    return this.prisma.complaint.findMany({
      where: { customerId },
      include: complaintInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findTechnicianByComplaintId(id: string) {
    return this.prisma.complaint.findUnique({
      where: { id },
      select: complaintTechnicianSelect,
    });
  }

  create(data: Prisma.ComplaintCreateInput) {
    return this.prisma.complaint.create({
      data,
      include: complaintInclude,
    });
  }

  async updateStatus(
    id: string,
    expectedStatus: ComplaintStatus,
    nextStatus: ComplaintStatus,
    actorId: string,
    reason?: string,
  ) {
    return this.prisma.$transaction(async transaction => {
      const updated = await transaction.complaint.updateMany({
        where: { id, status: expectedStatus },
        data: {
          status: nextStatus,
          resolvedAt:
            nextStatus === ComplaintStatus.RESOLVED ? new Date() : undefined,
          closedAt:
            nextStatus === ComplaintStatus.CLOSED ? new Date() : undefined,
        },
      });
      if (updated.count !== 1) return null;
      await transaction.complaintHistory.create({
        data: {
          complaintId: id,
          type: ComplaintHistoryType.STATUS_CHANGED,
          actorId,
          previousStatus: expectedStatus,
          currentStatus: nextStatus,
          message: reason,
          metadata: { event: nextStatus },
        },
      });
      return transaction.complaint.findUniqueOrThrow({
        where: { id },
        include: complaintInclude,
      });
    });
  }

  async assignTechnician(
    complaintId: string,
    technicianId: string,
    assignedById: string,
    notes?: string,
  ) {
    if (!assignedById) {
      throw new Error('assignedById is required for new assignments');
    }
    return this.prisma.$transaction(async transaction => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${complaintId}, 0))`;
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${technicianId}, 1))`;
      const complaint = await transaction.complaint.findUnique({
        where: { id: complaintId },
        include: {
          assignments: {
            where: { status: { in: ACTIVE_ASSIGNMENTS } },
            include: { workOrder: true },
            orderBy: { assignedAt: 'desc' },
          },
          workOrders: {
            where: { status: WorkOrderStatus.COMPLETED },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (!complaint) return { kind: 'complaint_missing' as const };
      if (complaint.status === ComplaintStatus.CLOSED)
        return { kind: 'complaint_closed' as const };
      if (complaint.status === ComplaintStatus.RESOLVED)
        return { kind: 'complaint_resolved' as const };
      if (complaint.workOrders.length)
        return { kind: 'work_completed' as const };

      const technician = await transaction.technician.findUnique({
        where: { id: technicianId },
      });
      if (!technician) return { kind: 'technician_missing' as const };
      if (technician.status !== TechnicianStatus.AVAILABLE)
        return { kind: 'technician_unavailable' as const };

      const previous = complaint.assignments[0];
      if (previous?.technicianId === technicianId)
        return { kind: 'already_assigned' as const };

      const now = new Date();
      if (previous) {
        await transaction.technicianAssignment.update({
          where: { id: previous.id },
          data: {
            status: TechnicianAssignmentStatus.CANCELLED,
            cancelledAt: now,
          },
        });
        if (previous.workOrder) {
          await transaction.workOrder.update({
            where: { id: previous.workOrder.id },
            data: { status: WorkOrderStatus.CANCELLED, cancelledAt: now },
          });
          await transaction.workOrderHistory.create({
            data: {
              workOrderId: previous.workOrder.id,
              type: WorkOrderHistoryType.ASSIGNMENT_CHANGED,
              actorId: assignedById,
              previousStatus: previous.workOrder.status,
              currentStatus: WorkOrderStatus.CANCELLED,
              note: notes,
              metadata: { event: 'REASSIGNED', technicianId },
            },
          });
        }
        await transaction.technician.update({
          where: { id: previous.technicianId },
          data: { status: TechnicianStatus.AVAILABLE },
        });
      }

      const assignment = await transaction.technicianAssignment.create({
        data: {
          complaintId,
          technicianId,
          assignedById,
          assignedAt: now,
          notes,
        },
      });
      const workOrder = await transaction.workOrder.create({
        data: {
          number: `WO-${complaint.ticketNumber}-${assignment.id.slice(0, 8).toUpperCase()}`,
          complaintId,
          customerId: complaint.customerId,
          technicianId,
          assignmentId: assignment.id,
          assignedAt: now,
          notes,
          history: {
            create: {
              type: WorkOrderHistoryType.CREATED,
              actorId: assignedById,
              currentStatus: WorkOrderStatus.ASSIGNED,
              note: notes,
              metadata: { event: 'CREATED', assignmentId: assignment.id },
            },
          },
        },
      });
      await transaction.technician.update({
        where: { id: technicianId },
        data: { status: TechnicianStatus.BUSY },
      });
      await transaction.complaint.update({
        where: { id: complaintId },
        data: {
          status: ComplaintStatus.ASSIGNED,
          history: {
            create: {
              type: ComplaintHistoryType.ASSIGNMENT_CHANGED,
              actorId: assignedById,
              previousStatus: complaint.status,
              currentStatus: ComplaintStatus.ASSIGNED,
              message: notes,
              metadata: {
                event: previous ? 'REASSIGNED' : 'ASSIGNED',
                previousTechnicianId: previous?.technicianId,
                technicianId,
                assignmentId: assignment.id,
                workOrderId: workOrder.id,
              },
            },
          },
        },
      });
      return {
        kind: previous ? ('reassigned' as const) : ('assigned' as const),
        complaint: await transaction.complaint.findUniqueOrThrow({
          where: { id: complaintId },
          include: complaintInclude,
        }),
      };
    });
  }
}
