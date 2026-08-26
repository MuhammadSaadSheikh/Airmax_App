import type { InternetPackage } from '@/services/packages/models';
import type { PackageDto } from '@/services/api/package/package.models';

export type SubscriptionStatusDto =
  'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export type SubscriptionStatus =
  'pending' | 'active' | 'expired' | 'suspended' | 'cancelled';

export type SubscriptionHistoryTypeDto =
  'CREATED' | 'STATUS_CHANGED' | 'PACKAGE_CHANGED' | 'CANCELLED';

export type SubscriptionHistoryDto = {
  id: string;
  type: SubscriptionHistoryTypeDto;
  actorId: string | null;
  previousStatus: SubscriptionStatusDto | null;
  currentStatus: SubscriptionStatusDto | null;
  previousPackageId: string | null;
  currentPackageId: string | null;
  packageName: string | null;
  packageSpeedMbps: number | null;
  packagePrice: string | null;
  metadata: unknown;
  occurredAt: string;
};

export type SubscriptionDto = {
  id: string;
  customerId: string;
  packageId: string;
  status: SubscriptionStatusDto;
  startsAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  package: PackageDto;
  history: SubscriptionHistoryDto[];
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionHistory = {
  id: string;
  type: 'created' | 'status-changed' | 'package-changed' | 'cancelled';
  previousStatus: SubscriptionStatus | null;
  currentStatus: SubscriptionStatus | null;
  previousPackageId: string | null;
  currentPackageId: string | null;
  packageName: string | null;
  packageSpeed: number | null;
  packagePrice: number | null;
  occurredAt: string;
};

export type CustomerSubscription = {
  id: string;
  customerId: string;
  packageId: string;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  package: InternetPackage;
  history: SubscriptionHistory[];
  createdAt: string;
  updatedAt: string;
};

export type CreateSubscriptionInput = {
  customerId: string;
  packageId: string;
  startsAt?: string;
  endsAt?: string;
};

export type ChangeSubscriptionPackageInput = {
  packageId: string;
  reason?: string;
};

export interface CustomerSubscriptionService {
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CustomerSubscription>;
  getSubscriptionById(id: string): Promise<CustomerSubscription>;
  getCustomerSubscriptions(customerId: string): Promise<CustomerSubscription[]>;
  changePackage(
    id: string,
    input: ChangeSubscriptionPackageInput,
  ): Promise<CustomerSubscription>;
  cancelSubscription(
    id: string,
    reason?: string,
  ): Promise<CustomerSubscription>;
  activateSubscription(id: string): Promise<CustomerSubscription>;
}
