import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { WorkOrderActionDto } from './dto/work-order.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Patch(':id/accept')
  accept(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: WorkOrderActionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.workOrders.acceptWorkOrder(id, input.notes, actor);
  }

  @Patch(':id/start')
  start(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: WorkOrderActionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.workOrders.startWorkOrder(id, input.notes, actor);
  }

  @Patch(':id/complete')
  complete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: WorkOrderActionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.workOrders.completeWorkOrder(id, input.notes, actor);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: WorkOrderActionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.workOrders.cancelWorkOrder(id, input.notes, actor);
  }
}
