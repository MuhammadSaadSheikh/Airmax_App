import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import {
  ChangeSubscriptionPackageDto,
  CancelSubscriptionDto,
  CreateSubscriptionDto,
} from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}
  @Post() create(
    @Body() input: CreateSubscriptionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.subscriptions.createSubscription(input, actor);
  }
  @Get(':id') getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.subscriptions.getSubscriptionById(id, actor);
  }
  @Patch(':id/package')
  changePackage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeSubscriptionPackageDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.subscriptions.changeSubscriptionPackage(id, input, actor);
  }
  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CancelSubscriptionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.subscriptions.cancelSubscription(id, input.reason, actor);
  }
  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.subscriptions.activateSubscription(id, actor);
  }
}

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}
  @Get(':id/subscriptions')
  list(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.subscriptions.getCustomerSubscriptions(id, actor);
  }
}
