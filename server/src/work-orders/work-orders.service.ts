import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, WorkOrderStatus } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  WorkOrderReadResponseDto,
  WorkOrderResponseDto,
} from './dto/work-order.dto';
import { WorkOrdersRepository } from './work-orders.repository';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly workOrders: WorkOrdersRepository) {}

  async getWorkOrderById(id: string, actor: AuthUser) {
    const workOrder = await this.workOrders.findById(id);
    if (!workOrder) throw new NotFoundException('Work order not found');
    if (
      actor.role !== Role.ADMIN &&
      (actor.sub !== workOrder.customer.userId ||
        workOrder.complaint.customerId !== workOrder.customer.id)
    ) {
      throw new ForbiddenException('Work order access denied');
    }
    return new WorkOrderReadResponseDto(workOrder);
  }

  acceptWorkOrder(id: string, notes: string | undefined, actor: AuthUser) {
    return this.transition(
      id,
      WorkOrderStatus.ASSIGNED,
      WorkOrderStatus.ACCEPTED,
      notes,
      actor,
    );
  }

  startWorkOrder(id: string, notes: string | undefined, actor: AuthUser) {
    return this.transition(
      id,
      WorkOrderStatus.ACCEPTED,
      WorkOrderStatus.IN_PROGRESS,
      notes,
      actor,
    );
  }

  completeWorkOrder(id: string, notes: string | undefined, actor: AuthUser) {
    return this.transition(
      id,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.COMPLETED,
      notes,
      actor,
    );
  }

  async cancelWorkOrder(
    id: string,
    notes: string | undefined,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    const workOrder = await this.workOrders.findById(id);
    if (!workOrder) throw new NotFoundException('Work order not found');
    if (
      workOrder.status === WorkOrderStatus.COMPLETED ||
      workOrder.status === WorkOrderStatus.CANCELLED
    ) {
      throw new ConflictException('Terminal work order cannot change');
    }
    return this.performTransition(
      id,
      workOrder.status,
      WorkOrderStatus.CANCELLED,
      notes,
      actor,
    );
  }

  private async transition(
    id: string,
    expected: WorkOrderStatus,
    next: WorkOrderStatus,
    notes: string | undefined,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    return this.performTransition(id, expected, next, notes, actor);
  }

  private async performTransition(
    id: string,
    expected: WorkOrderStatus,
    next: WorkOrderStatus,
    notes: string | undefined,
    actor: AuthUser,
  ) {
    const result = await this.workOrders.transition(
      id,
      expected,
      next,
      actor.sub,
      notes,
    );
    if (result.kind === 'missing')
      throw new NotFoundException('Work order not found');
    if (result.kind === 'complaint_closed')
      throw new ConflictException('Closed complaint cannot be modified');
    if (result.kind === 'changed') {
      throw new ConflictException(
        `Invalid work order transition from ${result.current} to ${next}`,
      );
    }
    return new WorkOrderResponseDto(result.workOrder);
  }

  private assertAdmin(actor: AuthUser) {
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException('Work order mutation denied');
  }
}
