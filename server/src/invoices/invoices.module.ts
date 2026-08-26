import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CustomerInvoicesController,
  InvoicesController,
} from './invoices.controller';
import { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

@Module({
  controllers: [InvoicesController, CustomerInvoicesController],
  providers: [InvoicesService, InvoicesRepository, JwtAuthGuard, RolesGuard],
})
export class InvoicesModule {}
