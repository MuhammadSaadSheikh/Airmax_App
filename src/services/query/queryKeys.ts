export const queryKeys = {
  packages: ['packages'] as const,
  bills: ['bills'] as const,
  customers: ['customers'] as const,
  customerDashboard: (connectionId: string) =>
    ['customer-dashboard', connectionId] as const,
  networkHealth: (connectionId: string) =>
    ['network-health', connectionId] as const,
  packageMarketplace: ['package-marketplace'] as const,
  currentPackage: (connectionId: string) =>
    ['current-package', connectionId] as const,
  packageRecommendation: (connectionId: string) =>
    ['package-recommendation', connectionId] as const,
  packageDetail: (id: string) => ['package-detail', id] as const,
  packageComparison: ['package-comparison'] as const,
};
