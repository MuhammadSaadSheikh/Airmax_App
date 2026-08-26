import { ValidationError } from '../errors';
import { mapPackageDto } from '../package/package.mapper';
import type {
  CustomerSubscription,
  SubscriptionDto,
  SubscriptionHistory,
  SubscriptionHistoryDto,
  SubscriptionHistoryTypeDto,
  SubscriptionStatus,
  SubscriptionStatusDto,
} from './subscription.models';

export class SubscriptionContractError extends ValidationError {
  constructor(field: string) {
    super(`Invalid subscription response field: ${field}`, 502);
    this.name = 'SubscriptionContractError';
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SubscriptionContractError(field);
  }
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new SubscriptionContractError(field);
  return value || null;
}

function nullableNumber(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new SubscriptionContractError(field);
  }
  return parsed;
}

export function mapSubscriptionStatus(
  status: SubscriptionStatusDto,
): SubscriptionStatus {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'ACTIVE':
      return 'active';
    case 'EXPIRED':
      return 'expired';
    case 'SUSPENDED':
      return 'suspended';
    case 'CANCELLED':
      return 'cancelled';
    default:
      throw new SubscriptionContractError('status');
  }
}

function historyType(
  type: SubscriptionHistoryTypeDto,
): SubscriptionHistory['type'] {
  switch (type) {
    case 'CREATED':
      return 'created';
    case 'STATUS_CHANGED':
      return 'status-changed';
    case 'PACKAGE_CHANGED':
      return 'package-changed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      throw new SubscriptionContractError('history.type');
  }
}

function nullableStatus(
  status: SubscriptionStatusDto | null,
): SubscriptionStatus | null {
  return status === null ? null : mapSubscriptionStatus(status);
}

function mapHistory(history: SubscriptionHistoryDto): SubscriptionHistory {
  return {
    id: requiredString(history.id, 'history.id'),
    type: historyType(history.type),
    previousStatus: nullableStatus(history.previousStatus),
    currentStatus: nullableStatus(history.currentStatus),
    previousPackageId: nullableString(
      history.previousPackageId,
      'history.previousPackageId',
    ),
    currentPackageId: nullableString(
      history.currentPackageId,
      'history.currentPackageId',
    ),
    packageName: nullableString(history.packageName, 'history.packageName'),
    packageSpeed: nullableNumber(
      history.packageSpeedMbps,
      'history.packageSpeedMbps',
    ),
    packagePrice: nullableNumber(history.packagePrice, 'history.packagePrice'),
    occurredAt: requiredString(history.occurredAt, 'history.occurredAt'),
  };
}

export function mapSubscriptionDto(
  subscription: SubscriptionDto,
): CustomerSubscription {
  if (!subscription || typeof subscription !== 'object') {
    throw new SubscriptionContractError('subscription');
  }
  if (!Array.isArray(subscription.history)) {
    throw new SubscriptionContractError('history');
  }
  return {
    id: requiredString(subscription.id, 'id'),
    customerId: requiredString(subscription.customerId, 'customerId'),
    packageId: requiredString(subscription.packageId, 'packageId'),
    status: mapSubscriptionStatus(subscription.status),
    startsAt: requiredString(subscription.startsAt, 'startsAt'),
    endsAt: nullableString(subscription.endsAt, 'endsAt'),
    cancelledAt: nullableString(subscription.cancelledAt, 'cancelledAt'),
    package: mapPackageDto(subscription.package),
    history: subscription.history.map(mapHistory),
    createdAt: requiredString(subscription.createdAt, 'createdAt'),
    updatedAt: requiredString(subscription.updatedAt, 'updatedAt'),
  };
}
