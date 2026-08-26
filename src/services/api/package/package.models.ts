import type { InternetPackage } from '@/services/packages/models';

export type PackageBillingPeriodDto =
  'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type PackageStatusDto = 'ACTIVE' | 'INACTIVE';

export type PackageDto = {
  id: string;
  name: string;
  description: string | null;
  speedMbps: number;
  price: number | string;
  billingPeriod: PackageBillingPeriodDto;
  features: string[];
  status: PackageStatusDto;
  createdAt: string;
  updatedAt: string;
};

export interface PackageCatalogService {
  getPackages(): Promise<InternetPackage[]>;
  getPackageById(id: string): Promise<InternetPackage | undefined>;
}
