import {
  mockAdminPackages,
  mockPackageSubscriberSummaries,
} from './packages.mock';
import type {
  CreatePackageInput,
  PackageDto,
  PackageSubscriberSummaryDto,
  UpdatePackageInput,
} from './packages.models';

let packagesState = clonePackages(mockAdminPackages);
let summariesState = cloneSummaries(mockPackageSubscriberSummaries);
let nextPackageNumber = 1;

function clonePackage(packageDto: PackageDto): PackageDto {
  return { ...packageDto, features: [...packageDto.features] };
}

function clonePackages(packages: PackageDto[]): PackageDto[] {
  return packages.map(clonePackage);
}

function cloneSummary(
  summary: PackageSubscriberSummaryDto,
): PackageSubscriberSummaryDto {
  return { ...summary };
}

function cloneSummaries(
  summaries: PackageSubscriberSummaryDto[],
): PackageSubscriberSummaryDto[] {
  return summaries.map(cloneSummary);
}

function packageIndex(id: string): number {
  const index = packagesState.findIndex(item => item.id === id);
  if (index < 0) throw new Error('Package not found');
  return index;
}

function normalizedName(name: string): string {
  return name.trim().toLocaleLowerCase('en');
}

function normalizeInput(input: CreatePackageInput): CreatePackageInput {
  const features = input.features
    .map(feature => feature.trim())
    .filter(Boolean);
  if (!input.name.trim()) throw new Error('Package name is required');
  if (!Number.isFinite(input.speedMbps) || input.speedMbps <= 0)
    throw new Error('Speed must be greater than zero');
  if (!Number.isFinite(input.price) || input.price <= 0)
    throw new Error('Price must be greater than zero');
  if (!Number.isFinite(input.durationDays) || input.durationDays <= 0)
    throw new Error('Duration must be greater than zero');
  if (features.length === 0)
    throw new Error('Add at least one package feature');
  return {
    name: input.name.trim(),
    speedMbps: input.speedMbps,
    price: input.price,
    durationDays: input.durationDays,
    description: input.description?.trim() || null,
    features,
  };
}

function assertUniqueName(name: string, excludedId?: string) {
  const duplicate = packagesState.some(
    item =>
      item.id !== excludedId &&
      normalizedName(item.name) === normalizedName(name),
  );
  if (duplicate) throw new Error('A package with this name already exists');
}

function nextId(): string {
  const id = `mock-package-${nextPackageNumber}`;
  nextPackageNumber += 1;
  return id;
}

export const mockPackageRepository = {
  list(): PackageDto[] {
    return clonePackages(packagesState);
  },

  getById(id: string): PackageDto | undefined {
    const packageDto = packagesState.find(item => item.id === id);
    return packageDto ? clonePackage(packageDto) : undefined;
  },

  subscriberSummary(packageId: string): PackageSubscriberSummaryDto {
    packageIndex(packageId);
    const summary = summariesState.find(item => item.packageId === packageId);
    return cloneSummary(summary ?? { packageId, subscriberCount: 0 });
  },

  create(input: CreatePackageInput): PackageDto {
    const normalized = normalizeInput(input);
    assertUniqueName(normalized.name);
    const timestamp = new Date().toISOString();
    const packageDto: PackageDto = {
      id: nextId(),
      ...normalized,
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    packagesState = [...packagesState, packageDto];
    summariesState = [
      ...summariesState,
      { packageId: packageDto.id, subscriberCount: 0 },
    ];
    return clonePackage(packageDto);
  },

  update(input: UpdatePackageInput): PackageDto {
    const index = packageIndex(input.packageId);
    const normalized = normalizeInput(input);
    assertUniqueName(normalized.name, input.packageId);
    const current = packagesState[index]!;
    const updated: PackageDto = {
      ...current,
      ...normalized,
      updatedAt: new Date().toISOString(),
    };
    packagesState[index] = updated;
    return clonePackage(updated);
  },

  activate(packageId: string): PackageDto {
    const index = packageIndex(packageId);
    const updated: PackageDto = {
      ...packagesState[index]!,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };
    packagesState[index] = updated;
    return clonePackage(updated);
  },

  deactivate(packageId: string): PackageDto {
    const index = packageIndex(packageId);
    const updated: PackageDto = {
      ...packagesState[index]!,
      status: 'INACTIVE',
      updatedAt: new Date().toISOString(),
    };
    packagesState[index] = updated;
    return clonePackage(updated);
  },

  removePermanently(): never {
    throw new Error('Permanent package deletion is not supported');
  },

  reset(): void {
    packagesState = clonePackages(mockAdminPackages);
    summariesState = cloneSummaries(mockPackageSubscriberSummaries);
    nextPackageNumber = 1;
  },
};
