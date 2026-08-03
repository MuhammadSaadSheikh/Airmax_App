import {
  createNavigationContainerRef,
  type ParamListBase,
  useRoute,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

const destinations: Record<string, { name: string; params?: object }> = {
  '/(auth)/login': { name: 'Login' },
  '/(auth)/otp': { name: 'OTP' },
  '/(auth)/forgot': { name: 'ForgotPassword' },
  '/(customer)': { name: 'CustomerPortal' },
  '/(customer)/packages': { name: 'CustomerPortal', params: { screen: 'Packages' } },
  '/(customer)/billing': { name: 'CustomerPortal', params: { screen: 'Billing' } },
  '/(customer)/support': { name: 'CustomerPortal', params: { screen: 'Support' } },
  '/(admin)': { name: 'AdminPortal' },
  '/customer/install': { name: 'InstallationRequest' },
  '/customer/payment': { name: 'Payment' },
  '/customer/complaint-new': { name: 'NewComplaint' },
  '/customer/package': { name: 'ActivePackage' },
  '/customer/package-detail': { name: 'PackageDetail' },
  '/customer/notifications': { name: 'Notifications' },
  '/customer/edit-profile': { name: 'EditProfile' },
  '/admin/payments': { name: 'AdminPayments' },
  '/admin/technicians': { name: 'Technicians' },
  '/admin/areas': { name: 'ServiceAreas' },
  '/admin/reports': { name: 'Reports' },
  '/admin/customer-form': { name: 'CustomerForm' },
  '/admin/customer-detail': { name: 'CustomerDetail' },
  '/admin/package-form': { name: 'PackageForm' },
  '/admin/complaint-detail': { name: 'ComplaintDetail' },
};

function resolve(target: string | { pathname: string; params?: object }) {
  const pathname = typeof target === 'string' ? target : target.pathname;
  const route = destinations[pathname];
  if (!route) throw new Error(`Unknown AIRMAX route: ${pathname}`);
  return {
    name: route.name,
    params: { ...route.params, ...(typeof target === 'string' ? {} : target.params) },
  };
}

export const router = {
  push(target: string | { pathname: string; params?: object }) {
    if (!navigationRef.isReady()) return;
    const route = resolve(target);
    navigationRef.navigate(route.name, route.params);
  },
  replace(target: string | { pathname: string; params?: object }) {
    if (!navigationRef.isReady()) return;
    const route = resolve(target);
    navigationRef.reset({ index: 0, routes: [{ name: route.name, params: route.params }] });
  },
  back() {
    if (navigationRef.canGoBack()) navigationRef.goBack();
  },
};

export function useLocalSearchParams<T extends object>() {
  const route = useRoute();
  return (route.params ?? {}) as T;
}
