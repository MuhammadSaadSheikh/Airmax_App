import { mockDelay } from '../client';
import { mockCustomerRepository } from '../customers.mock.repository';
import { resolveMockCustomer } from '../mockCustomerContext';
import { mapCustomerDto } from './customer.mapper';
import type {
  CustomerDto,
  CustomerService,
  CustomerStatus,
  CustomerStatusDto,
  UpdateCustomerProfileInput,
} from './customer.models';
import type { ApiCustomerStatus, CustomerDetailDto } from '../customers.models';

function mockStatus(status: ApiCustomerStatus): CustomerStatusDto {
  switch (status) {
    case 'ACTIVE':
      return 'ACTIVE';
    case 'SUSPENDED':
      return 'SUSPENDED';
    case 'PENDING':
    case 'DISABLED':
      return 'INACTIVE';
  }
}

function legacyStatus(status: CustomerStatus): ApiCustomerStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'suspended':
      return 'SUSPENDED';
    case 'inactive':
      return 'DISABLED';
  }
}

function mockDto(customer: CustomerDetailDto): CustomerDto {
  return {
    id: customer.id,
    userId: customer.id,
    accountNumber: customer.connectionId ?? `MOCK-${customer.id}`,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    status: mockStatus(customer.status),
    billingAddress: customer.address,
    serviceAddress: customer.address,
    cnic: customer.cnic,
    connectionId: customer.connectionId,
    installationDate: customer.installationDate,
    routerDetails: customer.routerDetails,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function requireCustomer(id: string): CustomerDetailDto {
  const customer = mockCustomerRepository.getById(id);
  if (!customer) throw new Error('Customer not found');
  return customer;
}

export const mockCustomerService: CustomerService = {
  async getCurrentCustomer() {
    await mockDelay();
    return mapCustomerDto(mockDto(resolveMockCustomer('unknown')));
  },

  async getCustomerById(id: string) {
    await mockDelay();
    return mapCustomerDto(mockDto(requireCustomer(id)));
  },

  async updateCustomer(id: string, input: UpdateCustomerProfileInput) {
    await mockDelay();
    const current = requireCustomer(id);
    const updated = mockCustomerRepository.updateInformation({
      customerId: id,
      name: input.name ?? current.name,
      phone: current.phone,
      email: current.email,
      address: input.address === undefined ? current.address : input.address,
      cnic: input.cnic === undefined ? current.cnic : input.cnic,
    });
    return mapCustomerDto(mockDto(updated));
  },

  async updateCustomerStatus(id: string, status: CustomerStatus) {
    await mockDelay();
    return mapCustomerDto(
      mockDto(mockCustomerRepository.setStatus(id, legacyStatus(status))),
    );
  },
};
