export type CustomerStatus = 'active' | 'suspended' | 'inactive';

export type CustomerStatusDto = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export type CustomerDto = {
  id: string;
  userId: string;
  accountNumber: string;
  name: string;
  phone: string;
  email: string | null;
  status: CustomerStatusDto;
  billingAddress: string | null;
  serviceAddress: string | null;
  cnic: string | null;
  connectionId: string | null;
  installationDate: string | null;
  routerDetails: unknown;
  createdAt: string;
  updatedAt: string;
};

export type CustomerProfile = {
  id: string;
  accountNumber: string;
  name: string;
  phone: string;
  email: string | null;
  status: CustomerStatus;
  address: string | null;
  billingAddress: string | null;
  cnic: string | null;
  connectionId: string | null;
  installationDate: string | null;
  router: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCustomerProfileInput = {
  accountNumber?: string;
  name?: string;
  address?: string | null;
  billingAddress?: string | null;
  cnic?: string | null;
  connectionId?: string | null;
  installationDate?: string | null;
};

export type UpdateCustomerDto = {
  accountNumber?: string;
  name?: string;
  serviceAddress?: string | null;
  billingAddress?: string | null;
  cnic?: string | null;
  connectionId?: string | null;
  installationDate?: string | null;
};

export interface CustomerService {
  getCurrentCustomer(): Promise<CustomerProfile>;
  getCustomerById(id: string): Promise<CustomerProfile>;
  updateCustomer(
    id: string,
    input: UpdateCustomerProfileInput,
  ): Promise<CustomerProfile>;
  updateCustomerStatus(
    id: string,
    status: CustomerStatus,
  ): Promise<CustomerProfile>;
}
