import { mockDelay } from '../client';
import { mockPackageRepository } from '../packages.mock.repository';
import type { PackageDto as LegacyPackageDto } from '../packages.models';
import { mapPackageDto } from './package.mapper';
import type { PackageCatalogService, PackageDto } from './package.models';

function productionDto(packageItem: LegacyPackageDto): PackageDto {
  return {
    id: packageItem.id,
    name: packageItem.name,
    description: packageItem.description,
    speedMbps: packageItem.speedMbps,
    price: packageItem.price,
    billingPeriod: 'MONTHLY',
    features: [...packageItem.features],
    status: packageItem.status,
    createdAt: packageItem.createdAt,
    updatedAt: packageItem.updatedAt,
  };
}

export const mockPackageCatalogService: PackageCatalogService = {
  async getPackages() {
    await mockDelay();
    return mockPackageRepository
      .list()
      .filter(packageItem => packageItem.status === 'ACTIVE')
      .map(productionDto)
      .map(mapPackageDto);
  },

  async getPackageById(id: string) {
    await mockDelay();
    const packageItem = mockPackageRepository.getById(id);
    return packageItem?.status === 'ACTIVE'
      ? mapPackageDto(productionDto(packageItem))
      : undefined;
  },
};
