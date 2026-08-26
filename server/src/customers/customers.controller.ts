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
import { CustomersService } from './customers.service';
import {
  ChangeCustomerStatusDto,
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() input: CreateCustomerDto) {
    return this.customers.createCustomer(input);
  }

  @Get('me')
  me(@CurrentUser() actor: AuthUser) {
    return this.customers.getCustomerByUserId(actor.sub, actor);
  }

  @Get(':id')
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.customers.getCustomerById(id, actor);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  changeStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeCustomerStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.customers.changeCustomerStatus(id, input.status, actor);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
    @Body() input: UpdateCustomerDto,
  ) {
    return this.customers.updateCustomer(id, input, actor);
  }
}
