import type {
  CurrentPackageSnapshot,
  InternetPackage,
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

const plans: InternetPackage[] = [
  {
    id: 'basic',
    name: 'AIRMAX Basic',
    speed: 50,
    price: 1800,
    billingCycle: 'monthly',
    features: ['Unlimited internet', 'HD streaming', 'Standard support'],
    benefits: ['Reliable browsing', 'HD video', 'Work from home ready'],
    usersSupported: 4,
    isRecommended: false,
    category: 'basic',
    description: 'Dependable connectivity for everyday browsing and streaming.',
    faqs,
  },
  {
    id: 'premium',
    name: 'AIRMAX Premium',
    speed: 100,
    price: 3500,
    billingCycle: 'monthly',
    features: ['Unlimited internet', '4K streaming', 'Gaming optimized', 'Priority support'],
    benefits: ['Low-latency gaming', 'Multiple 4K streams', 'Faster support'],
    usersSupported: 8,
    isRecommended: false,
    category: 'premium',
    description: 'Premium speed for connected homes, gaming and 4K entertainment.',
    faqs,
  },
  {
    id: 'ultra',
    name: 'AIRMAX Ultra',
    speed: 300,
    price: 6500,
    billingCycle: 'monthly',
    features: ['Unlimited internet', 'Multi-room 4K', 'Pro gaming', 'Premium support'],
    benefits: ['Maximum performance', 'Heavy multi-device use', 'Premium care'],
    usersSupported: 15,
    isRecommended: true,
    category: 'ultra',
    description: 'Our fastest home experience for demanding connected households.',
    faqs,
  },
];

const delay = async () => {
  await new Promise<void>(resolve => setTimeout(resolve, 320));
};

const copyPlan = (plan: InternetPackage): InternetPackage => ({
  ...plan,
  features: [...plan.features],
  benefits: [...plan.benefits],
  faqs: plan.faqs.map(faq => ({ ...faq })),
});

export const packageService: PackageService = {
  async getPackages() {
    await delay();
    return plans.map(copyPlan);
  },
  async getPackage(id) {
    await delay();
    const plan = plans.find(item => item.id === id);
    return plan ? copyPlan(plan) : undefined;
  },
  async getCurrentPackage(connectionId) {
    void connectionId;
    await delay();
    return {
      package: copyPlan(plans[1]!),
      subscription: {
        packageId: 'premium',
        activationDate: '2026-07-15',
        expiryDate: '15 August 2026',
        status: 'active',
        remainingDays: 10,
      },
    };
  },
  async comparePackages(packageIds) {
    await delay();
    const selected = packageIds?.length
      ? plans.filter(plan => packageIds.includes(plan.id))
      : plans;
    return {
      packages: selected.map(copyPlan),
      comparisonFeatures: [
        { key: 'speed', label: 'Speed', values: Object.fromEntries(selected.map(plan => [plan.id, `${plan.speed} Mbps`])) },
        { key: 'price', label: 'Price', values: Object.fromEntries(selected.map(plan => [plan.id, `Rs. ${plan.price.toLocaleString('en-PK')}`])) },
        { key: 'streaming', label: 'Streaming', values: { basic: 'HD', premium: '4K', ultra: 'Multi 4K' } },
        { key: 'gaming', label: 'Gaming', values: { basic: 'Standard', premium: 'Optimized', ultra: 'Pro' } },
        { key: 'support', label: 'Support', values: { basic: 'Standard', premium: 'Priority', ultra: 'Premium' } },
      ],
    };
  },
  async getRecommendations(connectionId) {
    void connectionId;
    await delay();
    return [{
      packageId: 'ultra',
      reason: ['Your usage is high', 'Multiple devices detected', 'Better streaming experience'],
      score: 94,
    }];
  },
};
