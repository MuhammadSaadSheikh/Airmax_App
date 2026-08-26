import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ComplaintsController,
  CustomerComplaintsController,
} from './complaints.controller';
import { ComplaintsRepository } from './complaints.repository';
import { ComplaintsService } from './complaints.service';

@Module({
  controllers: [ComplaintsController, CustomerComplaintsController],
  providers: [
    ComplaintsRepository,
    ComplaintsService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
