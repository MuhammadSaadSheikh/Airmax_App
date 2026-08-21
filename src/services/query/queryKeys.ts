export const queryKeys = {
  currentUser: ['current-user'] as const,
  packages: ['packages'] as const,
  bills: ['bills'] as const,
  adminCustomers: ['admin-customers'] as const,
  adminCustomerLists: ['admin-customers', 'list'] as const,
  adminCustomerList: (search: string) =>
    ['admin-customers', 'list', { search }] as const,
  adminCustomerDetail: (id: string) =>
    ['admin-customers', 'detail', id] as const,
  adminCustomerPackageOptions: ['admin-customers', 'package-options'] as const,
  adminPackages: ['admin-packages'] as const,
  adminPackageList: ['admin-packages', 'list'] as const,
  adminPackageDetail: (id: string) => ['admin-packages', 'detail', id] as const,
  adminPackageSubscribers: (id: string) =>
    ['admin-packages', 'subscribers', id] as const,
  adminComplaints: ['admin-complaints'] as const,
  adminComplaintList: ['admin-complaints', 'list'] as const,
  adminComplaintDetail: (id: string) =>
    ['admin-complaints', 'detail', id] as const,
  adminComplaintTechnicians: ['admin-complaints', 'technicians'] as const,
  adminTechnicians: ['admin-technicians'] as const,
  adminTechnicianList: ['admin-technicians', 'list'] as const,
  adminTechnicianDetail: (id: string) =>
    ['admin-technicians', 'detail', id] as const,
  adminTechnicianWorkload: (id: string) =>
    ['admin-technicians', 'workload', id] as const,
  adminTechnicianHistory: (id: string) =>
    ['admin-technicians', 'history', id] as const,
  adminSubscriptions: ['admin-subscriptions'] as const,
  adminSubscriptionList: ['admin-subscriptions', 'list'] as const,
  adminSubscriptionDetail: (id: string) =>
    ['admin-subscriptions', 'detail', id] as const,
  adminCustomerSubscriptions: (customerId: string) =>
    ['admin-subscriptions', 'customer', customerId] as const,
  adminBilling: ['admin-billing'] as const,
  adminInvoiceList: ['admin-billing', 'invoices'] as const,
  adminInvoiceDetail: (id: string) =>
    ['admin-billing', 'invoices', 'detail', id] as const,
  adminPayments: ['admin-billing', 'payments'] as const,
  adminPaymentDetail: (id: string) =>
    ['admin-billing', 'payments', 'detail', id] as const,
  adminBillingSummary: ['admin-billing', 'summary'] as const,
  adminDashboard: ['admin-dashboard'] as const,
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
  supportComplaintsRoot: ['support-complaints'] as const,
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
