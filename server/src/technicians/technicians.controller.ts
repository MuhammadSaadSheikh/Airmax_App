import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateTechnicianStatusDto } from './dto/technician.dto';
import { TechniciansService } from './technicians.service';

@Controller('technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class TechniciansController {
  constructor(private readonly technicians: TechniciansService) {}

  @Get()
  list() {
    return this.technicians.listTechnicians();
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.technicians.getTechnicianById(id);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateTechnicianStatusDto,
  ) {
    return this.technicians.updateTechnicianStatus(id, input.status);
  }
}
