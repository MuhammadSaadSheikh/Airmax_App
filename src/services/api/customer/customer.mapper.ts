import { ValidationError } from '../errors';
import type {
  CustomerDto,
  CustomerProfile,
  CustomerStatus,
  CustomerStatusDto,
  UpdateCustomerDto,
  UpdateCustomerProfileInput,
} from './customer.models';

export class CustomerContractError extends ValidationError {
  constructor(field: string) {
    super(`Invalid customer response field: ${field}`, 502);
    this.name = 'CustomerContractError';
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new CustomerContractError(field);
  }
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new CustomerContractError(field);
  return value || null;
}

function mapStatus(status: CustomerStatusDto | string): CustomerStatus {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'SUSPENDED':
      return 'suspended';
    case 'INACTIVE':
      return 'inactive';
    default:
      throw new CustomerContractError('status');
  }
}

function routerLabel(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const details = value as Record<string, unknown>;
  return nullableString(
    details.model ?? details.name ?? details.serialNumber ?? details.serial,
    'routerDetails',
  );
}

export function mapCustomerDto(customer: CustomerDto): CustomerProfile {
  if (!customer || typeof customer !== 'object') {
    throw new CustomerContractError('customer');
  }
  const billingAddress = nullableString(
    customer.billingAddress,
    'billingAddress',
  );
  const serviceAddress = nullableString(
    customer.serviceAddress,
    'serviceAddress',
  );
  return {
    id: requiredString(customer.id, 'id'),
    accountNumber: requiredString(customer.accountNumber, 'accountNumber'),
    name: requiredString(customer.name, 'name'),
    phone: requiredString(customer.phone, 'phone'),
    email: nullableString(customer.email, 'email'),
    status: mapStatus(customer.status),
    address: serviceAddress ?? billingAddress,
    billingAddress,
    cnic: nullableString(customer.cnic, 'cnic'),
    connectionId: nullableString(customer.connectionId, 'connectionId'),
    installationDate: nullableString(
      customer.installationDate,
      'installationDate',
    ),
    router: routerLabel(customer.routerDetails),
    createdAt: requiredString(customer.createdAt, 'createdAt'),
    updatedAt: requiredString(customer.updatedAt, 'updatedAt'),
  };
}

export function mapCustomerUpdateInput(
  input: UpdateCustomerProfileInput,
): UpdateCustomerDto {
  return {
    accountNumber: input.accountNumber,
    name: input.name,
    serviceAddress: input.address,
    billingAddress: input.billingAddress,
    cnic: input.cnic,
    connectionId: input.connectionId,
    installationDate: input.installationDate,
  };
}

export function mapCustomerStatusInput(
  status: CustomerStatus,
): CustomerStatusDto {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'suspended':
      return 'SUSPENDED';
    case 'inactive':
      return 'INACTIVE';
  }
}
