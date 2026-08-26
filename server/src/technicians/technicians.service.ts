import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TechnicianStatus } from '@prisma/client';
import { TechnicianResponseDto } from './dto/technician.dto';
import { TechniciansRepository } from './technicians.repository';

@Injectable()
export class TechniciansService {
  constructor(private readonly technicians: TechniciansRepository) {}

  async listTechnicians() {
    return (await this.technicians.findAll()).map(
      technician => new TechnicianResponseDto(technician),
    );
  }

  async getTechnicianById(id: string) {
    const technician = await this.technicians.findById(id);
    if (!technician) throw new NotFoundException('Technician not found');
    return new TechnicianResponseDto(technician);
  }

  async updateTechnicianStatus(id: string, status: TechnicianStatus) {
    const technician = await this.technicians.findById(id);
    if (!technician) throw new NotFoundException('Technician not found');
    if (technician.status === status)
      return new TechnicianResponseDto(technician);
    const activeWork = await this.technicians.countActiveWork(id);
    if (activeWork > 0 && status !== TechnicianStatus.BUSY) {
      throw new ConflictException(
        'Technician with active work must remain BUSY',
      );
    }
    return new TechnicianResponseDto(
      await this.technicians.update(id, { status }),
    );
  }
}
