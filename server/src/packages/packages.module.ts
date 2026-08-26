import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PackagesController } from './packages.controller';
import { PackagesRepository } from './packages.repository';
import { PackagesService } from './packages.service';

@Module({
  controllers: [PackagesController],
  providers: [PackagesService, PackagesRepository, JwtAuthGuard, RolesGuard],
})
export class PackagesModule {}
