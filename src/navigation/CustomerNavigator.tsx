import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BillingScreen from '@/features/billing/screens/BillingScreen';
import PaymentScreen from '@/features/billing/screens/PaymentScreen';
import BillingCenterScreen from '@/features/billing/screens/BillingCenterScreen';
import InvoiceDetailScreen from '@/features/billing/screens/InvoiceDetailScreen';
import InvoiceScreen from '@/features/billing/screens/InvoiceScreen';
import PaymentHistoryScreen from '@/features/billing/screens/PaymentHistoryScreen';
import PaymentMethodsScreen from '@/features/billing/screens/PaymentMethodsScreen';
import PaymentSuccessScreen from '@/features/billing/screens/PaymentSuccessScreen';
import CustomerHomeScreen from '@/features/customer/screens/CustomerHomeScreen';
import EditProfileScreen from '@/features/customer/screens/EditProfileScreen';
import NotificationsScreen from '@/features/customer/screens/NotificationsScreen';
import NotificationDetailScreen from '@/features/notifications/screens/NotificationDetailScreen';
import NotificationSettingsScreen from '@/features/notifications/screens/NotificationSettingsScreen';
import RecommendationDetailScreen from '@/features/notifications/screens/RecommendationDetailScreen';
import ProfileScreen from '@/features/customer/screens/ProfileScreen';
import InternetHealthScreen from '@/features/customer/screens/InternetHealthScreen';
import SpeedTestScreen from '@/features/customer/screens/SpeedTestScreen';
import DiagnosticsScreen from '@/features/customer/screens/DiagnosticsScreen';
import ActivePackageScreen from '@/features/packages/screens/ActivePackageScreen';
import PackageDetailScreen from '@/features/packages/screens/PackageDetailScreen';
import PackagesScreen from '@/features/packages/screens/PackagesScreen';
import PackageComparisonScreen from '@/features/packages/screens/PackageComparisonScreen';
import UpgradePackageScreen from '@/features/packages/screens/UpgradePackageScreen';
import NewComplaintScreen from '@/features/support/screens/NewComplaintScreen';
import SupportScreen from '@/features/support/screens/SupportScreen';
import SupportHomeScreen from '@/features/support/screens/SupportHomeScreen';
import CreateComplaintScreen from '@/features/support/screens/CreateComplaintScreen';
import ComplaintDetailScreen from '@/features/support/screens/ComplaintDetailScreen';
import ComplaintHistoryScreen from '@/features/support/screens/ComplaintHistoryScreen';
import { colors } from '@/theme';
import { createTabOptions } from './options';
import type { CustomerStackParamList, CustomerTabParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();
const Tabs = createBottomTabNavigator<CustomerTabParamList>();
const icons = {
  Home: 'home',
  Packages: 'speedometer',
  Billing: 'receipt',
  Support: 'headset',
  Profile: 'person',
} as const;

function CustomerTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <Tabs.Navigator
      screenOptions={createTabOptions(icons, width, insets.bottom)}
    >
      <Tabs.Screen name="Home" component={CustomerHomeScreen} />
      <Tabs.Screen name="Packages" component={PackagesScreen} />
      <Tabs.Screen name="Billing" component={BillingScreen} />
      <Tabs.Screen name="Support" component={SupportScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function CustomerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="ActivePackage" component={ActivePackageScreen} />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen name="PackagesHome" component={PackagesScreen} />
      <Stack.Screen
        name="PackageComparison"
        component={PackageComparisonScreen}
      />
      <Stack.Screen name="UpgradePackage" component={UpgradePackageScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="BillingCenter" component={BillingCenterScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="Invoices" component={InvoiceScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="SupportHome" component={SupportHomeScreen} />
      <Stack.Screen name="CreateComplaint" component={CreateComplaintScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen
        name="ComplaintHistory"
        component={ComplaintHistoryScreen}
      />
      <Stack.Screen name="NewComplaint" component={NewComplaintScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      <Stack.Screen
        name="RecommendationDetail"
        component={RecommendationDetailScreen}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="InternetHealth" component={InternetHealthScreen} />
      <Stack.Screen name="SpeedTest" component={SpeedTestScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
    </Stack.Navigator>
  );
}
