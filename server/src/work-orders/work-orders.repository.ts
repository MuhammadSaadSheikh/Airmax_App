import { Injectable } from '@nestjs/common';
import {
  ComplaintHistoryType,
  ComplaintStatus,
  TechnicianAssignmentStatus,
  TechnicianStatus,
  WorkOrderHistoryType,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { workOrderInclude } from './dto/work-order.dto';

@Injectable()
export class WorkOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.workOrder.findUnique({
      where: { id },
      include: workOrderInclude,
    });
  }

  async transition(
    id: string,
    expectedStatus: WorkOrderStatus,
    nextStatus: WorkOrderStatus,
    actorId: string,
    notes?: string,
  ) {
    return this.prisma.$transaction(async transaction => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
      const current = await transaction.workOrder.findUnique({
        where: { id },
        include: { complaint: true, assignment: true },
      });
      if (!current) return { kind: 'missing' as const };
      if (current.complaint.status === ComplaintStatus.CLOSED)
        return { kind: 'complaint_closed' as const };
      if (current.status !== expectedStatus)
        return { kind: 'changed' as const, current: current.status };

      const now = new Date();
      const workOrderTimes = {
        acceptedAt: nextStatus === WorkOrderStatus.ACCEPTED ? now : undefined,
        startedAt: nextStatus === WorkOrderStatus.IN_PROGRESS ? now : undefined,
        completedAt: nextStatus === WorkOrderStatus.COMPLETED ? now : undefined,
        cancelledAt: nextStatus === WorkOrderStatus.CANCELLED ? now : undefined,
      };
      await transaction.workOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          ...workOrderTimes,
          notes: notes ?? undefined,
          history: {
            create: {
              type: WorkOrderHistoryType.STATUS_CHANGED,
              actorId,
              previousStatus: current.status,
              currentStatus: nextStatus,
              note: notes,
              metadata: { event: nextStatus },
            },
          },
        },
      });

      const assignmentStatus = this.assignmentStatus(nextStatus);
      await transaction.technicianAssignment.update({
        where: { id: current.assignmentId },
        data: {
          status: assignmentStatus,
          acceptedAt: nextStatus === WorkOrderStatus.ACCEPTED ? now : undefined,
          completedAt:
            nextStatus === WorkOrderStatus.COMPLETED ? now : undefined,
          cancelledAt:
            nextStatus === WorkOrderStatus.CANCELLED ? now : undefined,
        },
      });

      let nextComplaintStatus: ComplaintStatus | undefined;
      if (nextStatus === WorkOrderStatus.IN_PROGRESS)
        nextComplaintStatus = ComplaintStatus.IN_PROGRESS;
      if (nextStatus === WorkOrderStatus.COMPLETED)
        nextComplaintStatus = ComplaintStatus.RESOLVED;
      if (nextStatus === WorkOrderStatus.CANCELLED)
        nextComplaintStatus = ComplaintStatus.PENDING;
      if (nextComplaintStatus) {
        await transaction.complaint.update({
          where: { id: current.complaintId },
          data: {
            status: nextComplaintStatus,
            resolvedAt:
              nextComplaintStatus === ComplaintStatus.RESOLVED
                ? now
                : undefined,
            history: {
              create: {
                type: ComplaintHistoryType.STATUS_CHANGED,
                actorId,
                previousStatus: current.complaint.status,
                currentStatus: nextComplaintStatus,
                message: notes,
                metadata: {
                  event:
                    nextStatus === WorkOrderStatus.COMPLETED
                      ? 'RESOLVED'
                      : `WORK_ORDER_${nextStatus}`,
                  workOrderId: id,
                },
              },
            },
          },
        });
      }

      if (
        nextStatus === WorkOrderStatus.COMPLETED ||
        nextStatus === WorkOrderStatus.CANCELLED
      ) {
        await transaction.technician.update({
          where: { id: current.technicianId },
          data: { status: TechnicianStatus.AVAILABLE },
        });
      }
      return {
        kind: 'updated' as const,
        workOrder: await transaction.workOrder.findUniqueOrThrow({
          where: { id },
          include: workOrderInclude,
        }),
      };
    });
  }

  private assignmentStatus(status: WorkOrderStatus) {
    switch (status) {
      case WorkOrderStatus.ACCEPTED:
        return TechnicianAssignmentStatus.ACCEPTED;
      case WorkOrderStatus.IN_PROGRESS:
        return TechnicianAssignmentStatus.ACTIVE;
      case WorkOrderStatus.COMPLETED:
        return TechnicianAssignmentStatus.COMPLETED;
      case WorkOrderStatus.CANCELLED:
        return TechnicianAssignmentStatus.CANCELLED;
      default:
        return TechnicianAssignmentStatus.ASSIGNED;
    }
  }
}
