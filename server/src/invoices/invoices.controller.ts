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
  CancelInvoiceDto,
  CreateInvoiceDto,
  UpdateInvoiceStatusDto,
} from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}
  @Get(':id') getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.invoices.getInvoiceById(id, actor);
  }
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() input: CreateInvoiceDto, @CurrentUser() actor: AuthUser) {
    return this.invoices.createInvoice(input, actor);
  }
  @Patch(':id/cancel')
  @Roles(Role.ADMIN)
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CancelInvoiceDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.invoices.cancelInvoice(id, input, actor);
  }
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateInvoiceStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.invoices.updateInvoiceStatus(id, input, actor);
  }
}

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerInvoicesController {
  constructor(private readonly invoices: InvoicesService) {}
  @Get(':id/invoices')
  list(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.invoices.getCustomerInvoices(id, actor);
  }
}
