export const queryKeys = {
  packages: ['packages'] as const,
  bills: ['bills'] as const,
  customers: ['customers'] as const,
  customerDashboard: (connectionId: string) =>
    ['customer-dashboard', connectionId] as const,
};
