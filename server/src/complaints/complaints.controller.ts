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
import { ComplaintsService } from './complaints.service';
import {
  AssignTechnicianDto,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Post()
  create(@Body() input: CreateComplaintDto, @CurrentUser() actor: AuthUser) {
    return this.complaints.createComplaint(input, actor);
  }

  @Get(':id')
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.complaints.getComplaintById(id, actor);
  }

  @Get(':id/technician')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  getTechnician(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.complaints.getComplaintTechnician(id, actor);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateComplaintStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.complaints.updateComplaintStatus(id, input, actor);
  }

  @Post(':id/assign-technician')
  @Roles(Role.ADMIN)
  assignTechnician(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: AssignTechnicianDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.complaints.assignTechnician(id, input, actor);
  }
}

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get(':id/complaints')
  getCustomerComplaints(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.complaints.getCustomerComplaints(id, actor);
  }
}
