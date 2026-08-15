import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminCustomerPackage,
  AdminCustomerStatus,
  AdminCustomerSubscription,
  AdminSubscriptionStatus,
  ApiCustomerStatus,
  CustomerDetailDto,
  CustomerListItemDto,
  CustomerPackageDto,
  CustomerSubscriptionDto,
} from './customers.models';
import type { ApiSubscriptionStatus } from './subscriptions.models';

function mapCustomerStatus(status: ApiCustomerStatus): AdminCustomerStatus {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'SUSPENDED':
      return 'suspended';
    case 'DISABLED':
      return 'disabled';
    case 'PENDING':
      return 'pending';
  }
}

function mapSubscriptionStatus(
  status: ApiSubscriptionStatus,
): AdminSubscriptionStatus {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'EXPIRED':
      return 'expired';
    case 'SUSPENDED':
      return 'suspended';
    case 'CANCELLED':
      return 'cancelled';
    case 'PENDING':
      return 'pending';
  }
}

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function mapCustomerListItem(
  customer: CustomerListItemDto,
): AdminCustomerListItem {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    status: mapCustomerStatus(customer.status),
    address: customer.address,
    connectionId: customer.connectionId,
    createdAt: customer.createdAt,
  };
}

export function mapCustomerPackage(
  customerPackage: CustomerPackageDto,
): AdminCustomerPackage {
  return {
    id: customerPackage.id,
    name: customerPackage.name,
    speedMbps: Math.max(0, customerPackage.speedMbps),
    price: numericValue(customerPackage.price),
    durationDays: Math.max(0, customerPackage.durationDays),
    description: customerPackage.description,
    features: [...customerPackage.features],
    status: customerPackage.status === 'ACTIVE' ? 'active' : 'inactive',
  };
}

function mapCustomerSubscription(
  subscription: CustomerSubscriptionDto,
): AdminCustomerSubscription {
  return {
    id: subscription.id,
    status: mapSubscriptionStatus(subscription.status),
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    pppoeUsername: subscription.pppoeUsername,
    package: mapCustomerPackage(subscription.package),
  };
}

export function mapCustomerDetail(
  customer: CustomerDetailDto,
): AdminCustomerDetail {
  return {
    ...mapCustomerListItem(customer),
    cnic: customer.cnic,
    installationDate: customer.installationDate,
    routerDetails: objectValue(customer.routerDetails),
    updatedAt: customer.updatedAt,
    latestSubscription: customer.subscriptions[0]
      ? mapCustomerSubscription(customer.subscriptions[0])
      : null,
  };
}
