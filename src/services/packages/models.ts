export type PackageCategory = 'basic' | 'premium' | 'ultra';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface PackageFaq {
  question: string;
  answer: string;
}

export interface InternetPackage {
  id: string;
  name: string;
  speed: number;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  benefits: string[];
  usersSupported: number;
  isRecommended: boolean;
  category: PackageCategory;
  description: string;
  faqs: PackageFaq[];
}

export interface CurrentSubscription {
  packageId: string;
  activationDate: string;
  expiryDate: string;
  status: 'active' | 'expiring' | 'expired';
  remainingDays: number;
}

export interface PackageComparisonFeature {
  key: 'speed' | 'price' | 'streaming' | 'gaming' | 'support';
  label: string;
  values: Record<string, string>;
}

export interface PackageComparison {
  packages: InternetPackage[];
  comparisonFeatures: PackageComparisonFeature[];
}

export interface Recommendation {
  packageId: string;
  reason: string[];
  score: number;
}

export interface CurrentPackageSnapshot {
  package: InternetPackage;
  subscription: CurrentSubscription;
}
