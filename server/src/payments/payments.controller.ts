import {
  Body,
  Controller,
  Get,
  Headers,
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
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get(':id') getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.payments.getPaymentById(id, actor);
  }
  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() input: CreatePaymentDto,
    @Headers('idempotency-key') key: string | undefined,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.payments.createPayment(input, key, actor);
  }
  @Patch(':id/refund')
  @Roles(Role.ADMIN)
  refund(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: RefundPaymentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.payments.refundPayment(id, input, actor);
  }
}

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicePaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get(':id/payments')
  list(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.payments.getInvoicePayments(id, actor);
  }
}
