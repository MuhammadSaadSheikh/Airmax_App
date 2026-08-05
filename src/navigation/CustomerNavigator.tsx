import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BillingScreen from '@/features/billing/screens/BillingScreen';
import PaymentScreen from '@/features/billing/screens/PaymentScreen';
import CustomerHomeScreen from '@/features/customer/screens/CustomerHomeScreen';
import EditProfileScreen from '@/features/customer/screens/EditProfileScreen';
import NotificationsScreen from '@/features/customer/screens/NotificationsScreen';
import ProfileScreen from '@/features/customer/screens/ProfileScreen';
import ActivePackageScreen from '@/features/packages/screens/ActivePackageScreen';
import PackageDetailScreen from '@/features/packages/screens/PackageDetailScreen';
import PackagesScreen from '@/features/packages/screens/PackagesScreen';
import NewComplaintScreen from '@/features/support/screens/NewComplaintScreen';
import SupportScreen from '@/features/support/screens/SupportScreen';
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
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="NewComplaint" component={NewComplaintScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
