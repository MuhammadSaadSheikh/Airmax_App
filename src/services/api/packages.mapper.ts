import type {
  AdminPackage,
  AdminPackageStatus,
  ApiPackageStatus,
  PackageDto,
  PackageSubscriberSummaryDto,
} from './packages.models';

function mapStatus(status: ApiPackageStatus): AdminPackageStatus {
  return status === 'ACTIVE' ? 'active' : 'inactive';
}

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function mapPackage(
  packageDto: PackageDto,
  summary: PackageSubscriberSummaryDto,
): AdminPackage {
  return {
    id: packageDto.id,
    name: packageDto.name,
    speedMbps: Math.max(0, packageDto.speedMbps),
    price: numericValue(packageDto.price),
    durationDays: Math.max(0, packageDto.durationDays),
    description: packageDto.description,
    features: [...packageDto.features],
    status: mapStatus(packageDto.status),
    subscriberCount: Math.max(0, summary.subscriberCount),
    createdAt: packageDto.createdAt,
    updatedAt: packageDto.updatedAt,
  };
}
