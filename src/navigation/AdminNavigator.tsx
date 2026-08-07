import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminComplaintsScreen from '@/features/admin/screens/AdminComplaintsScreen';
import AdminHomeScreen from '@/features/admin/screens/AdminHomeScreen';
import AdminMoreScreen from '@/features/admin/screens/AdminMoreScreen';
import AdminPackagesScreen from '@/features/admin/screens/AdminPackagesScreen';
import AdminPaymentsScreen from '@/features/admin/screens/AdminPaymentsScreen';
import ComplaintDetailScreen from '@/features/admin/screens/ComplaintDetailScreen';
import CustomerDetailScreen from '@/features/admin/screens/CustomerDetailScreen';
import CustomerFormScreen from '@/features/admin/screens/CustomerFormScreen';
import CustomersScreen from '@/features/admin/screens/CustomersScreen';
import PackageFormScreen from '@/features/admin/screens/PackageFormScreen';
import ReportsScreen from '@/features/admin/screens/ReportsScreen';
import ServiceAreasScreen from '@/features/admin/screens/ServiceAreasScreen';
import TechniciansScreen from '@/features/admin/screens/TechniciansScreen';
import {
  createTabOptions,
  modalScreenOptions,
  stackScreenOptions,
} from './options';
import type { AdminStackParamList, AdminTabParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();
const Tabs = createBottomTabNavigator<AdminTabParamList>();
const icons = {
  Overview: 'grid',
  Customers: 'people',
  Packages: 'speedometer',
  Complaints: 'chatbox-ellipses',
  More: 'menu',
} as const;

function AdminTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <Tabs.Navigator
      screenOptions={createTabOptions(icons, width, insets.bottom)}
    >
      <Tabs.Screen name="Overview" component={AdminHomeScreen} />
      <Tabs.Screen name="Customers" component={CustomersScreen} />
      <Tabs.Screen name="Packages" component={AdminPackagesScreen} />
      <Tabs.Screen name="Complaints" component={AdminComplaintsScreen} />
      <Tabs.Screen name="More" component={AdminMoreScreen} />
    </Tabs.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
      <Stack.Screen name="Technicians" component={TechniciansScreen} />
      <Stack.Screen name="ServiceAreas" component={ServiceAreasScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen
        name="CustomerForm"
        component={CustomerFormScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen
        name="PackageForm"
        component={PackageFormScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
    </Stack.Navigator>
  );
}
