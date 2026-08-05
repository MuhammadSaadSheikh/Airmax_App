import type { NavigatorScreenParams } from '@react-navigation/native';

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
  Payment: undefined;
  NewComplaint: undefined;
  Notifications: undefined;
  EditProfile: undefined;
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
  CustomerForm: undefined;
  CustomerDetail: { id: string };
  PackageForm: { id?: string } | undefined;
  ComplaintDetail: { id: string };
};
