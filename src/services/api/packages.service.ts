import { environment } from '@/config/environment';
import { mockDelay } from './client';
import { mapPackage } from './packages.mapper';
import { mockPackageRepository } from './packages.mock.repository';
import { mockSubscriptionRepository } from './subscriptions.mock.repository';
import type {
  AdminPackage,
  CreatePackageInput,
  PackageDto,
  UpdatePackageInput,
} from './packages.models';

function assertMockMode() {
  if (!environment.useMockApi) {
    throw new Error(
      'Admin package management is unavailable outside mock mode',
    );
  }
}

function mapRepositoryPackage(packageDto: PackageDto): AdminPackage {
  return mapPackage(packageDto, {
    packageId: packageDto.id,
    subscriberCount: mockSubscriptionRepository
      .list()
      .filter(
        subscription =>
          subscription.packageId === packageDto.id &&
          subscription.status !== 'CANCELLED' &&
          subscription.status !== 'EXPIRED',
      ).length,
  });
}

export const packagesService = {
  async list(): Promise<AdminPackage[]> {
    assertMockMode();
    await mockDelay();
    return mockPackageRepository.list().map(mapRepositoryPackage);
  },

  async getById(id: string): Promise<AdminPackage> {
    assertMockMode();
    await mockDelay();
    const packageDto = mockPackageRepository.getById(id);
    if (!packageDto) throw new Error('Package not found');
    return mapRepositoryPackage(packageDto);
  },

  async create(input: CreatePackageInput): Promise<AdminPackage> {
    assertMockMode();
    await mockDelay(500);
    return mapRepositoryPackage(mockPackageRepository.create(input));
  },

  async update(input: UpdatePackageInput): Promise<AdminPackage> {
    assertMockMode();
    await mockDelay(500);
    return mapRepositoryPackage(mockPackageRepository.update(input));
  },

  async activate(packageId: string): Promise<AdminPackage> {
    assertMockMode();
    await mockDelay(500);
    return mapRepositoryPackage(mockPackageRepository.activate(packageId));
  },

  async deactivate(packageId: string): Promise<AdminPackage> {
    assertMockMode();
    await mockDelay(500);
    return mapRepositoryPackage(mockPackageRepository.deactivate(packageId));
  },
};
