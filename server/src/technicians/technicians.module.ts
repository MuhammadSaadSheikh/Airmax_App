import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TechniciansController } from './technicians.controller';
import { TechniciansRepository } from './technicians.repository';
import { TechniciansService } from './technicians.service';

@Module({
  controllers: [TechniciansController],
  providers: [
    TechniciansRepository,
    TechniciansService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class TechniciansModule {}
