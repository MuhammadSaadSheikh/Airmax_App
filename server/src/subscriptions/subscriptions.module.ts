import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CustomerSubscriptionsController,
  SubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController, CustomerSubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionsRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class SubscriptionsModule {}
