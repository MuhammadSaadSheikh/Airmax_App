import { apiRequest } from '../client';
import { mapPackageDto } from './package.mapper';
import type { PackageCatalogService, PackageDto } from './package.models';

export const livePackageCatalogService: PackageCatalogService = {
  async getPackages() {
    const packages = await apiRequest<PackageDto[]>('/packages');
    return packages
      .filter(packageItem => packageItem.status === 'ACTIVE')
      .map(mapPackageDto);
  },

  async getPackageById(id: string) {
    const packageItem = await apiRequest<PackageDto>(
      `/packages/${encodeURIComponent(id)}`,
    );
    return packageItem.status === 'ACTIVE'
      ? mapPackageDto(packageItem)
      : undefined;
  },
};
