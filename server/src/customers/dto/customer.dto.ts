import { CustomerStatus, Prisma } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsUUID('4')
  userId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  accountNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  billingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  cnic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  connectionId?: string;

  @IsOptional()
  @IsDateString()
  installationDate?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  billingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  cnic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  connectionId?: string;

  @IsOptional()
  @IsDateString()
  installationDate?: string;
}

export class ChangeCustomerStatusDto {
  @IsEnum(CustomerStatus)
  status!: CustomerStatus;
}

export const customerWithIdentity = {
  user: {
    select: { id: true, phone: true, email: true },
  },
} satisfies Prisma.CustomerInclude;

export type CustomerWithIdentity = Prisma.CustomerGetPayload<{
  include: typeof customerWithIdentity;
}>;

export class CustomerResponseDto {
  readonly id: string;
  readonly userId: string;
  readonly accountNumber: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string | null;
  readonly status: CustomerStatus;
  readonly billingAddress: string | null;
  readonly serviceAddress: string | null;
  readonly cnic: string | null;
  readonly connectionId: string | null;
  readonly installationDate: Date | null;
  readonly routerDetails: Prisma.JsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(customer: CustomerWithIdentity) {
    this.id = customer.id;
    this.userId = customer.userId;
    this.accountNumber = customer.accountNumber;
    this.name = customer.name;
    this.phone = customer.user.phone;
    this.email = customer.user.email;
    this.status = customer.status;
    this.billingAddress = customer.billingAddress;
    this.serviceAddress = customer.serviceAddress;
    this.cnic = customer.cnic;
    this.connectionId = customer.connectionId;
    this.installationDate = customer.installationDate;
    this.routerDetails = customer.routerDetails;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }
}
