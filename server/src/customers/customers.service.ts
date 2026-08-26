import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomerStatus, Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CustomersRepository } from './customers.repository';
import {
  CreateCustomerDto,
  CustomerResponseDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customers: CustomersRepository) {}

  async createCustomer(input: CreateCustomerDto): Promise<CustomerResponseDto> {
    const [user, existing] = await Promise.all([
      this.customers.findUserById(input.userId),
      this.customers.findByUserId(input.userId),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (existing) throw new ConflictException('User already has a customer');

    const { userId, installationDate, ...profile } = input;
    try {
      const customer = await this.customers.create({
        ...profile,
        installationDate: installationDate
          ? new Date(installationDate)
          : undefined,
        user: { connect: { id: userId } },
      });
      return new CustomerResponseDto(customer);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException(
          'Customer profile conflicts with existing data',
        );
      }
      throw error;
    }
  }

  async getCustomerById(
    id: string,
    actor: AuthUser,
  ): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerById(id);
    this.assertCanAccess(customer.userId, actor);
    return new CustomerResponseDto(customer);
  }

  async getCustomerByUserId(
    userId: string,
    actor: AuthUser,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customers.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer not found');
    this.assertCanAccess(customer.userId, actor);
    return new CustomerResponseDto(customer);
  }

  async updateCustomer(
    id: string,
    input: UpdateCustomerDto,
    actor: AuthUser,
  ): Promise<CustomerResponseDto> {
    const current = await this.findCustomerById(id);
    this.assertCanAccess(current.userId, actor);
    const { installationDate, ...profile } = input;
    try {
      const customer = await this.customers.update(id, {
        ...profile,
        installationDate: installationDate
          ? new Date(installationDate)
          : undefined,
      });
      return new CustomerResponseDto(customer);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException(
          'Customer profile conflicts with existing data',
        );
      }
      throw error;
    }
  }

  async changeCustomerStatus(
    id: string,
    status: CustomerStatus,
    actor: AuthUser,
  ): Promise<CustomerResponseDto> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Customer status access denied');
    }
    await this.findCustomerById(id);
    return new CustomerResponseDto(await this.customers.update(id, { status }));
  }

  private async findCustomerById(id: string) {
    const customer = await this.customers.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private assertCanAccess(customerUserId: string, actor: AuthUser): void {
    if (actor.role !== Role.ADMIN && actor.sub !== customerUserId) {
      throw new ForbiddenException('Customer access denied');
    }
  }

  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
