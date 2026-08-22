import { mockCustomers } from './customers.mock';
import type {
  ApiCustomerStatus,
  CreateCustomerInput,
  CustomerDetailDto,
  SuspendCustomerInput,
  UpdateCustomerInformationInput,
} from './customers.models';

let customersState = cloneCustomers(mockCustomers);
let nextCustomerNumber = 1;

function cloneUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneUnknown);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, cloneUnknown(item)]),
  );
}

function cloneCustomer(customer: CustomerDetailDto): CustomerDetailDto {
  return {
    ...customer,
    routerDetails: cloneUnknown(customer.routerDetails),
    subscriptions: [],
  };
}

function cloneCustomers(customers: CustomerDetailDto[]): CustomerDetailDto[] {
  return customers.map(cloneCustomer);
}

function customerIndex(id: string): number {
  const index = customersState.findIndex(customer => customer.id === id);
  if (index < 0) throw new Error('Customer not found');
  return index;
}

function normalizedIdentity(value: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function assertUnique(
  field: 'phone' | 'email' | 'cnic' | 'connectionId',
  value: string | null,
  customerId?: string,
) {
  const normalized = normalizedIdentity(value);
  if (!normalized) return;
  const duplicate = customersState.some(
    customer =>
      customer.id !== customerId &&
      normalizedIdentity(customer[field]) === normalized,
  );
  if (duplicate) {
    const label = field === 'cnic' ? 'CNIC' : field;
    throw new Error(`A customer with this ${label} already exists`);
  }
}

export const mockCustomerRepository = {
  list(): CustomerDetailDto[] {
    return cloneCustomers(customersState);
  },

  getById(id: string): CustomerDetailDto | undefined {
    const customer = customersState.find(item => item.id === id);
    return customer ? cloneCustomer(customer) : undefined;
  },

  getByConnectionId(connectionId: string): CustomerDetailDto | undefined {
    const normalized = normalizedIdentity(connectionId);
    const customer = customersState.find(
      item => normalizedIdentity(item.connectionId) === normalized,
    );
    return customer ? cloneCustomer(customer) : undefined;
  },

  create(input: CreateCustomerInput): CustomerDetailDto {
    assertUnique('phone', input.phone);
    assertUnique('email', input.email);
    assertUnique('cnic', input.cnic);
    assertUnique('connectionId', input.connectionId);
    const timestamp = new Date().toISOString();
    const customer: CustomerDetailDto = {
      id: `mock-customer-${nextCustomerNumber++}`,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      role: 'CUSTOMER',
      status: 'PENDING',
      address: input.address?.trim() || null,
      connectionId: input.connectionId?.trim() || null,
      cnic: input.cnic?.trim() || null,
      installationDate: null,
      routerDetails: null,
      subscriptions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    customersState = [...customersState, customer];
    return cloneCustomer(customer);
  },

  setStatus(customerId: string, status: ApiCustomerStatus): CustomerDetailDto {
    const index = customerIndex(customerId);
    const updated = {
      ...customersState[index]!,
      status,
      updatedAt: new Date().toISOString(),
    };
    customersState[index] = updated;
    return cloneCustomer(updated);
  },

  suspend(input: SuspendCustomerInput): CustomerDetailDto {
    return this.setStatus(input.customerId, 'SUSPENDED');
  },

  updateInformation(input: UpdateCustomerInformationInput): CustomerDetailDto {
    const index = customerIndex(input.customerId);
    assertUnique('phone', input.phone, input.customerId);
    assertUnique('email', input.email, input.customerId);
    assertUnique('cnic', input.cnic, input.customerId);
    const customer = customersState[index]!;
    const updated: CustomerDetailDto = {
      ...customer,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      cnic: input.cnic?.trim() || null,
      updatedAt: new Date().toISOString(),
    };
    customersState[index] = updated;
    return cloneCustomer(updated);
  },

  reset(): void {
    customersState = cloneCustomers(mockCustomers);
    nextCustomerNumber = 1;
  },
};
