import type {
  AdminSubscription,
  AdminSubscriptionPackage,
  ApiSubscriptionStatus,
  SubscriptionDto,
  SubscriptionPackageDto,
  SubscriptionStatus,
} from './subscriptions.models';

export function mapSubscriptionStatus(
  status: ApiSubscriptionStatus,
): SubscriptionStatus {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'ACTIVE':
      return 'active';
    case 'SUSPENDED':
      return 'suspended';
    case 'EXPIRED':
      return 'expired';
    case 'CANCELLED':
      return 'cancelled';
  }
}

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function mapSubscriptionPackage(
  packageDto: SubscriptionPackageDto,
): AdminSubscriptionPackage {
  return {
    id: packageDto.id,
    name: packageDto.name,
    speedMbps: Math.max(0, packageDto.speedMbps),
    price: numericValue(packageDto.price),
    durationDays: Math.max(0, packageDto.durationDays),
    description: packageDto.description,
    features: [...packageDto.features],
    status: packageDto.status === 'ACTIVE' ? 'active' : 'inactive',
  };
}

export function mapSubscription(dto: SubscriptionDto): AdminSubscription {
  return {
    id: dto.id,
    status: mapSubscriptionStatus(dto.status),
    startsAt: dto.startsAt,
    expiresAt: dto.expiresAt,
    pppoeUsername: dto.pppoeUsername,
    customer: { ...dto.customer },
    package: mapSubscriptionPackage(dto.package),
    history: dto.history.map(event => ({
      id: event.id,
      status: mapSubscriptionStatus(event.status),
      packageId: event.packageId,
      packageName: event.packageName,
      note: event.note,
      createdAt: event.createdAt,
    })),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
