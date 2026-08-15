import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PaymentReceipt } from '@/services/billing';

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Customer: NavigatorScreenParams<CustomerStackParamList> | undefined;
  Admin: NavigatorScreenParams<AdminStackParamList> | undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Otp: undefined;
  ForgotPassword: undefined;
  InstallationRequest: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Packages: undefined;
  Billing: undefined;
  Support: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  ActivePackage: undefined;
  PackageDetail: { id: string };
  PackagesHome: undefined;
  PackageComparison: undefined;
  UpgradePackage: { id: string; action?: 'upgrade' | 'renew' };
  Payment: undefined;
  BillingCenter: undefined;
  PaymentMethods: undefined;
  PaymentHistory: undefined;
  Invoices: undefined;
  InvoiceDetail: { id: string };
  PaymentSuccess: { receipt: PaymentReceipt };
  SupportHome: undefined;
  CreateComplaint: undefined;
  ComplaintDetail: { id: string };
  ComplaintHistory: undefined;
  // Compatibility alias for the original complaint route.
  NewComplaint: undefined;
  Notifications: undefined;
  NotificationDetail: { id: string };
  NotificationSettings: undefined;
  RecommendationDetail: { id: string };
  EditProfile: undefined;
  InternetHealth: undefined;
  SpeedTest: undefined;
  Diagnostics: { issueType?: string } | undefined;
};

export type AdminTabParamList = {
  Overview: undefined;
  Customers: undefined;
  Packages: undefined;
  Complaints: undefined;
  More: undefined;
};

export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList> | undefined;
  AdminPayments: undefined;
  Technicians: undefined;
  ServiceAreas: undefined;
  Reports: undefined;
  CustomerDetail: { id: string };
  CustomerEdit: { id: string };
  CustomerPackageChange: { id: string };
  PackageDetail: { id: string };
  PackageCreate: undefined;
  PackageEdit: { id: string };
  ComplaintDetail: { id: string };
  Subscriptions: undefined;
  SubscriptionDetail: { id: string };
};
