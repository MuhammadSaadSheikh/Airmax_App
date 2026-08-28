import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintHistoryType, ComplaintStatus, Role } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { ComplaintsRepository } from './complaints.repository';
import {
  AssignTechnicianDto,
  ComplaintTechnicianResponseDto,
  ComplaintResponseDto,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

const COMPLAINT_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.PENDING]: [ComplaintStatus.ASSIGNED],
  [ComplaintStatus.ASSIGNED]: [ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.RESOLVED],
  [ComplaintStatus.RESOLVED]: [ComplaintStatus.CLOSED],
  [ComplaintStatus.CLOSED]: [],
};

@Injectable()
export class ComplaintsService {
  constructor(private readonly complaints: ComplaintsRepository) {}

  async createComplaint(input: CreateComplaintDto, actor: AuthUser) {
    const customer = await this.resolveCreationCustomer(input, actor);
    const complaint = await this.complaints.create({
      customer: { connect: { id: customer.id } },
      category: input.category,
      title: input.title,
      priority: input.priority,
      description: input.description,
      attachmentUrl: input.attachmentUrl,
      history: {
        create: {
          type: ComplaintHistoryType.CREATED,
          actor: { connect: { id: actor.sub } },
          currentStatus: ComplaintStatus.PENDING,
          metadata: { event: 'CREATED' },
        },
      },
    });
    return new ComplaintResponseDto(complaint);
  }

  private async resolveCreationCustomer(
    input: CreateComplaintDto,
    actor: AuthUser,
  ) {
    if (actor.role === Role.ADMIN) {
      if (!input.customerId) {
        throw new BadRequestException(
          'customerId is required for admin complaint creation',
        );
      }
      const customer = await this.complaints.findCustomerById(input.customerId);
      if (!customer) throw new NotFoundException('Customer not found');
      return customer;
    }

    if (input.customerId) {
      throw new ForbiddenException(
        'Customer complaint ownership cannot be supplied',
      );
    }
    const customer = await this.complaints.findCustomerByUserId(actor.sub);
    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer;
  }

  async getComplaintById(id: string, actor: AuthUser) {
    const complaint = await this.findComplaint(id);
    this.assertCanAccess(complaint.customer.userId, actor);
    return new ComplaintResponseDto(complaint);
  }

  async getCustomerComplaints(customerId: string, actor: AuthUser) {
    const customer = await this.complaints.findCustomerById(customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    this.assertCanAccess(customer.userId, actor);
    return (await this.complaints.findByCustomerId(customerId)).map(
      complaint => new ComplaintResponseDto(complaint),
    );
  }

  async getComplaintTechnician(id: string, actor: AuthUser) {
    const complaint = await this.complaints.findTechnicianByComplaintId(id);
    if (!complaint) throw new NotFoundException('Complaint not found');
    this.assertCanAccess(complaint.customer.userId, actor);
    const assignment = complaint.assignments[0];
    if (!assignment)
      throw new NotFoundException('Complaint has no assigned technician');
    if (!assignment.technician)
      throw new NotFoundException('Assigned technician not found');
    return new ComplaintTechnicianResponseDto(assignment.technician);
  }

  async updateComplaintStatus(
    id: string,
    input: UpdateComplaintStatusDto,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    if (input.status === ComplaintStatus.RESOLVED) {
      return this.resolveComplaint(id, input.reason, actor);
    }
    const complaint = await this.findComplaint(id);
    this.assertTransition(complaint.status, input.status);
    const changed = await this.complaints.updateStatus(
      id,
      complaint.status,
      input.status,
      actor.sub,
      input.reason,
    );
    if (!changed) throw new ConflictException('Complaint changed; retry');
    return new ComplaintResponseDto(changed);
  }

  async assignTechnician(
    complaintId: string,
    input: AssignTechnicianDto,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    const result = await this.complaints.assignTechnician(
      complaintId,
      input.technicianId,
      actor.sub,
      input.notes,
    );
    switch (result.kind) {
      case 'complaint_missing':
        throw new NotFoundException('Complaint not found');
      case 'technician_missing':
        throw new NotFoundException('Technician not found');
      case 'complaint_closed':
        throw new ConflictException('Closed complaint cannot be modified');
      case 'complaint_resolved':
        throw new ConflictException('Resolved complaint cannot be assigned');
      case 'work_completed':
        throw new ConflictException('Completed work cannot be reassigned');
      case 'technician_unavailable':
        throw new ConflictException('Technician is not available');
      case 'already_assigned':
        throw new ConflictException(
          'Technician is already assigned to this complaint',
        );
      default:
        return new ComplaintResponseDto(result.complaint);
    }
  }

  reassignTechnician(
    complaintId: string,
    input: AssignTechnicianDto,
    actor: AuthUser,
  ) {
    return this.assignTechnician(complaintId, input, actor);
  }

  async resolveComplaint(
    id: string,
    reason: string | undefined,
    actor: AuthUser,
  ) {
    this.assertAdmin(actor);
    const complaint = await this.findComplaint(id);
    this.assertTransition(complaint.status, ComplaintStatus.RESOLVED);
    const changed = await this.complaints.updateStatus(
      id,
      complaint.status,
      ComplaintStatus.RESOLVED,
      actor.sub,
      reason,
    );
    if (!changed) throw new ConflictException('Complaint changed; retry');
    return new ComplaintResponseDto(changed);
  }

  private async findComplaint(id: string) {
    const complaint = await this.complaints.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  private assertCanAccess(userId: string, actor: AuthUser) {
    if (actor.role !== Role.ADMIN && actor.sub !== userId)
      throw new ForbiddenException('Complaint access denied');
  }

  private assertAdmin(actor: AuthUser) {
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException('Complaint mutation denied');
  }

  private assertTransition(from: ComplaintStatus, to: ComplaintStatus) {
    if (!COMPLAINT_TRANSITIONS[from].includes(to)) {
      throw new ConflictException(
        `Invalid complaint transition from ${from} to ${to}`,
      );
    }
  }
}
