import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { resolveMockCustomer } from '@/services/api/mockCustomerContext';
import { mockSubscriptionRepository } from '@/services/api/subscriptions.mock.repository';
import type { PackageDto } from '@/services/api/packages.models';
import type {
  CurrentPackageSnapshot,
  InternetPackage,
  PackageCategory,
  PackageComparison,
  Recommendation,
} from './models';

export interface PackageService {
  getPackages(): Promise<InternetPackage[]>;
  getPackage(id: string): Promise<InternetPackage | undefined>;
  getCurrentPackage(connectionId: string): Promise<CurrentPackageSnapshot>;
  comparePackages(packageIds?: string[]): Promise<PackageComparison>;
  getRecommendations(connectionId: string): Promise<Recommendation[]>;
}

const faqs = [
  {
    question: 'When will my new plan activate?',
    answer: 'Plan changes are scheduled for your next billing cycle.',
  },
  {
    question: 'Are there any data limits?',
    answer: 'All listed AIRMAX plans include unlimited internet usage.',
  },
];

const wait = () => new Promise<void>(resolve => setTimeout(resolve, 320));

type PackageSnapshot = Omit<PackageDto, 'createdAt' | 'updatedAt'>;

function category(packageItem: PackageSnapshot): PackageCategory {
  if (packageItem.speedMbps <= 30) return 'basic';
  if (packageItem.speedMbps <= 100) return 'premium';
  return 'ultra';
}

function mapPackage(packageItem: PackageSnapshot): InternetPackage {
  const price = Number(packageItem.price);
  return {
    id: packageItem.id,
    name: packageItem.name,
    speed: packageItem.speedMbps,
    price: Number.isFinite(price) ? price : 0,
    billingCycle: 'monthly',
    features: [...packageItem.features],
    benefits: [
      `${packageItem.speedMbps} Mbps connectivity`,
      `${packageItem.durationDays}-day subscription period`,
      'AIRMAX customer support',
    ],
    usersSupported: Math.max(2, Math.round(packageItem.speedMbps / 12)),
    isRecommended: packageItem.id === 'premium',
    category: category(packageItem),
    description:
      packageItem.description ?? `${packageItem.name} internet package.`,
    faqs: faqs.map(item => ({ ...item })),
  };
}

function activePackages(): InternetPackage[] {
  return mockPackageRepository
    .list()
    .filter(item => item.status === 'ACTIVE')
    .map(mapPackage);
}

export const packageService: PackageService = {
  async getPackages() {
    await wait();
    return activePackages();
  },

  async getPackage(id) {
    await wait();
    const packageItem = mockPackageRepository.getById(id);
    return packageItem?.status === 'ACTIVE'
      ? mapPackage(packageItem)
      : undefined;
  },

  async getCurrentPackage(connectionId) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    const subscription = mockSubscriptionRepository.getByCustomerId(
      customer.id,
    )[0];
    if (!subscription) throw new Error('Customer subscription not found');
    const expiry = new Date(subscription.expiresAt).getTime();
    const remainingDays = Math.max(
      0,
      Math.ceil((expiry - Date.now()) / 86_400_000),
    );
    return {
      package: mapPackage(subscription.package),
      subscription: {
        packageId: subscription.packageId,
        activationDate: subscription.startsAt,
        expiryDate: subscription.expiresAt,
        status:
          subscription.status === 'EXPIRED' ||
          subscription.status === 'CANCELLED'
            ? 'expired'
            : remainingDays <= 5
              ? 'expiring'
              : 'active',
        remainingDays,
      },
    };
  },

  async comparePackages(packageIds) {
    await wait();
    const packages = activePackages().filter(
      item => !packageIds || packageIds.includes(item.id),
    );
    const values = (value: (item: InternetPackage) => string) =>
      Object.fromEntries(packages.map(item => [item.id, value(item)]));
    return {
      packages,
      comparisonFeatures: [
        {
          key: 'speed',
          label: 'Speed',
          values: values(item => `${item.speed} Mbps`),
        },
        {
          key: 'price',
          label: 'Monthly price',
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
  },

  async getRecommendations(connectionId) {
    await wait();
    const customer = resolveMockCustomer(connectionId);
    const current = mockSubscriptionRepository.getByCustomerId(customer.id)[0];
    return activePackages()
      .filter(item => item.id !== current?.packageId)
      .map((item, index) => ({
        packageId: item.id,
        reason: [
          `${item.speed} Mbps for connected devices`,
          `PKR ${item.price} monthly catalogue price`,
        ],
        score: Math.max(60, 92 - index * 8),
      }));
  },
};
