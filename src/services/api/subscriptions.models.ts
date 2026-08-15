export type ApiSubscriptionStatus =
  'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';

export type SubscriptionStatus =
  'pending' | 'active' | 'suspended' | 'expired' | 'cancelled';

export type SubscriptionCustomerDto = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  connectionId: string | null;
};

export type SubscriptionPackageDto = {
  id: string;
  name: string;
  speedMbps: number;
  price: number | string;
  durationDays: number;
  description: string | null;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE';
};

export type SubscriptionHistoryDto = {
  id: string;
  subscriptionId: string;
  status: ApiSubscriptionStatus;
  packageId: string;
  packageName: string;
  note: string | null;
  createdAt: string;
};

export type SubscriptionDto = {
  id: string;
  userId: string;
  packageId: string;
  status: ApiSubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  pppoeUsername: string | null;
  customer: SubscriptionCustomerDto;
  package: SubscriptionPackageDto;
  history: SubscriptionHistoryDto[];
  createdAt: string;
  updatedAt: string;
};

export type AdminSubscriptionCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  connectionId: string | null;
};

export type AdminSubscriptionPackage = {
  id: string;
  name: string;
  speedMbps: number;
  price: number;
  durationDays: number;
  description: string | null;
  features: string[];
  status: 'active' | 'inactive';
};

export type SubscriptionHistory = {
  id: string;
  status: SubscriptionStatus;
  packageId: string;
  packageName: string;
  note: string | null;
  createdAt: string;
};

export type AdminSubscription = {
  id: string;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  pppoeUsername: string | null;
  customer: AdminSubscriptionCustomer;
  package: AdminSubscriptionPackage;
  history: SubscriptionHistory[];
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionStatusFilter = SubscriptionStatus | 'all';

export type ChangeSubscriptionPackageInput = {
  subscriptionId: string;
  packageId: string;
};

export type SubscriptionActionInput = {
  subscriptionId: string;
};

export type AssignCustomerSubscriptionInput = {
  customerId: string;
  packageId: string;
};
