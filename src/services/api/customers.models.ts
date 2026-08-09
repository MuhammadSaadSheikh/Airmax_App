export type ApiCustomerRole = 'ADMIN' | 'CUSTOMER';
export type ApiCustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DISABLED';
export type ApiSubscriptionStatus =
  'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export type CustomerListItemDto = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: ApiCustomerRole;
  status: ApiCustomerStatus;
  address: string | null;
  connectionId: string | null;
  createdAt: string;
};

export type CustomerPackageDto = {
  id: string;
  name: string;
  speedMbps: number;
  price: number | string;
  durationDays: number;
  description: string | null;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE';
};

export type CustomerSubscriptionDto = {
  id: string;
  userId: string;
  packageId: string;
  status: ApiSubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  pppoeUsername: string | null;
  createdAt: string;
  updatedAt: string;
  package: CustomerPackageDto;
};

export type CustomerDetailDto = CustomerListItemDto & {
  cnic: string | null;
  installationDate: string | null;
  routerDetails: unknown;
  updatedAt: string;
  subscriptions: CustomerSubscriptionDto[];
};

export type AdminCustomerStatus =
  'active' | 'suspended' | 'pending' | 'disabled';

export type AdminSubscriptionStatus =
  'pending' | 'active' | 'expired' | 'suspended' | 'cancelled';

export type AdminCustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: AdminCustomerStatus;
  address: string | null;
  connectionId: string | null;
  createdAt: string;
};

export type AdminCustomerPackage = {
  id: string;
  name: string;
  speedMbps: number;
  price: number;
  durationDays: number;
  description: string | null;
  features: string[];
  status: 'active' | 'inactive';
};

export type AdminCustomerSubscription = {
  id: string;
  status: AdminSubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  pppoeUsername: string | null;
  package: AdminCustomerPackage;
};

export type AdminCustomerDetail = AdminCustomerListItem & {
  cnic: string | null;
  installationDate: string | null;
  routerDetails: Record<string, unknown> | null;
  updatedAt: string;
  latestSubscription: AdminCustomerSubscription | null;
};

export type CustomerListFilters = {
  search?: string;
};

export type CustomerStatusFilter = AdminCustomerStatus | 'all';

export type SuspensionReason =
  'non-payment' | 'policy-violation' | 'customer-request' | 'technical-review';

export type UpdateCustomerInformationInput = {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  cnic: string | null;
};

export type SuspendCustomerInput = {
  customerId: string;
  reason: SuspensionReason;
};

export type ChangeCustomerPackageInput = {
  customerId: string;
  packageId: string;
};

export type CustomerPackageOption = AdminCustomerPackage;
