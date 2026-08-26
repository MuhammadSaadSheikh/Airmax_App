import { packageCatalogService } from '@/services/api/package/package.service';
import { customerSubscriptionService } from '@/services/api/subscription/subscription.service';
import type { CustomerSubscription } from '@/services/api/subscription/subscription.models';
import type {
  CurrentPackageSnapshot,
  InternetPackage,
  PackageComparison,
  Recommendation,
} from '@/services/packages/models';

export interface AuthenticatedPackageService {
  getPackages(): Promise<InternetPackage[]>;
  getPackage(id: string): Promise<InternetPackage | undefined>;
  getCurrentPackage(customerId: string): Promise<CurrentPackageSnapshot | null>;
  comparePackages(packageIds?: string[]): Promise<PackageComparison>;
  getRecommendations(customerId: string): Promise<Recommendation[]>;
}

function currentSubscription(
  subscriptions: CustomerSubscription[],
): CustomerSubscription | undefined {
  return (
    subscriptions.find(subscription => subscription.status === 'active') ??
    subscriptions.find(subscription => subscription.status === 'pending') ??
    subscriptions.find(subscription => subscription.status === 'suspended')
  );
}

function remainingDays(endsAt: string | null): number {
  if (!endsAt) return 0;
  const expiry = new Date(endsAt).getTime();
  return Number.isFinite(expiry)
    ? Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000))
    : 0;
}

function currentStatus(
  subscription: CustomerSubscription,
  days: number,
): CurrentPackageSnapshot['subscription']['status'] {
  switch (subscription.status) {
    case 'pending':
      return 'pending';
    case 'suspended':
      return 'suspended';
    case 'expired':
    case 'cancelled':
      return 'expired';
    case 'active':
      return subscription.endsAt && days <= 5 ? 'expiring' : 'active';
  }
}

export function mapCurrentPackage(
  subscriptions: CustomerSubscription[],
): CurrentPackageSnapshot | null {
  const subscription = currentSubscription(subscriptions);
  if (!subscription) return null;
  const days = remainingDays(subscription.endsAt);
  return {
    package: subscription.package,
    subscription: {
      id: subscription.id,
      customerId: subscription.customerId,
      packageId: subscription.packageId,
      activationDate: subscription.startsAt,
      expiryDate: subscription.endsAt ?? 'No scheduled expiry',
      status: currentStatus(subscription, days),
      remainingDays: days,
    },
  };
}

export function buildPackageComparison(
  packages: InternetPackage[],
  packageIds?: string[],
): PackageComparison {
  const selected = packages.filter(
    packageItem => !packageIds || packageIds.includes(packageItem.id),
  );
  const values = (value: (item: InternetPackage) => string) =>
    Object.fromEntries(selected.map(item => [item.id, value(item)]));
  return {
    packages: selected,
    comparisonFeatures: [
      {
        key: 'speed',
        label: 'Speed',
        values: values(item => `${item.speed} Mbps`),
      },
      {
        key: 'price',
        label: 'Plan price',
        values: values(item => `PKR ${item.price}`),
      },
      {
        key: 'streaming',
        label: 'Streaming',
        values: values(item => (item.speed >= 50 ? '4K ready' : 'HD ready')),
      },
      {
        key: 'gaming',
        label: 'Gaming',
        values: values(item => (item.speed >= 50 ? 'Optimized' : 'Standard')),
      },
      {
        key: 'support',
        label: 'Support',
        values: values(item => (item.speed >= 100 ? 'Priority' : 'Standard')),
      },
    ],
  };
}

export const authenticatedPackageService: AuthenticatedPackageService = {
  getPackages: () => packageCatalogService.getPackages(),
  getPackage: id => packageCatalogService.getPackageById(id),

  async getCurrentPackage(customerId) {
    return mapCurrentPackage(
      await customerSubscriptionService.getCustomerSubscriptions(customerId),
    );
  },

  async comparePackages(packageIds) {
    return buildPackageComparison(
      await packageCatalogService.getPackages(),
      packageIds,
    );
  },

  async getRecommendations(customerId) {
    const [packages, subscriptions] = await Promise.all([
      packageCatalogService.getPackages(),
      customerSubscriptionService.getCustomerSubscriptions(customerId),
    ]);
    const current = currentSubscription(subscriptions);
    return packages
      .filter(packageItem => packageItem.id !== current?.packageId)
      .map((packageItem, index) => ({
        packageId: packageItem.id,
        reason: [
          `${packageItem.speed} Mbps for connected devices`,
          `PKR ${packageItem.price} ${packageItem.billingCycle} catalogue price`,
        ],
        score: Math.max(60, 92 - index * 8),
      }));
  },
};
