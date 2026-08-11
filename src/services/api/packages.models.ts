export type ApiPackageStatus = 'ACTIVE' | 'INACTIVE';

export type PackageDto = {
  id: string;
  name: string;
  speedMbps: number;
  price: number | string;
  durationDays: number;
  description: string | null;
  features: string[];
  status: ApiPackageStatus;
  createdAt: string;
  updatedAt: string;
};

export type PackageSubscriberSummaryDto = {
  packageId: string;
  subscriberCount: number;
};

export type AdminPackageStatus = 'active' | 'inactive';

export type AdminPackage = {
  id: string;
  name: string;
  speedMbps: number;
  price: number;
  durationDays: number;
  description: string | null;
  features: string[];
  status: AdminPackageStatus;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PackageStatusFilter = AdminPackageStatus | 'all';

export type CreatePackageInput = {
  name: string;
  speedMbps: number;
  price: number;
  durationDays: number;
  description: string | null;
  features: string[];
};

export type UpdatePackageInput = CreatePackageInput & {
  packageId: string;
};

export type SetPackageStatusInput = {
  packageId: string;
  status: AdminPackageStatus;
};
