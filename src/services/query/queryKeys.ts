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
  currentBill: (connectionId: string) =>
    ['current-bill', connectionId] as const,
  invoices: (connectionId: string) =>
    ['billing-invoices', connectionId] as const,
  invoiceDetail: (id: string) => ['invoice-detail', id] as const,
  paymentHistory: (connectionId: string) =>
    ['payment-history', connectionId] as const,
  paymentMethods: (connectionId: string) =>
    ['payment-methods', connectionId] as const,
  supportComplaints: (connectionId: string) =>
    ['support-complaints', connectionId] as const,
  supportComplaintDetail: (connectionId: string, id: string) =>
    ['support-complaint-detail', connectionId, id] as const,
  notifications: (connectionId: string) =>
    ['notifications', connectionId] as const,
  notificationDetail: (id: string) => ['notification-detail', id] as const,
  notificationPreferences: (connectionId: string) =>
    ['notification-preferences', connectionId] as const,
  recommendations: (connectionId: string) =>
    ['notification-recommendations', connectionId] as const,
  recommendationDetail: (id: string) => ['recommendation-detail', id] as const,
};
