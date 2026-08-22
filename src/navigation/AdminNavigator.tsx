import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminComplaintsScreen from '@/features/admin/screens/AdminComplaintsScreen';
import AdminAuditScreen from '@/features/admin/screens/AdminAuditScreen';
import AdminHomeScreen from '@/features/admin/screens/AdminHomeScreen';
import AdminMoreScreen from '@/features/admin/screens/AdminMoreScreen';
import AdminPackagesScreen from '@/features/admin/screens/AdminPackagesScreen';
import AdminBillingScreen from '@/features/admin/screens/AdminBillingScreen';
import AdminSubscriptionsScreen from '@/features/admin/screens/AdminSubscriptionsScreen';
import ComplaintDetailScreen from '@/features/admin/screens/ComplaintDetailScreen';
import CustomerDetailScreen from '@/features/admin/screens/CustomerDetailScreen';
import CustomerEditScreen from '@/features/admin/screens/CustomerEditScreen';
import CustomerPackageChangeScreen from '@/features/admin/screens/CustomerPackageChangeScreen';
import CustomersScreen from '@/features/admin/screens/CustomersScreen';
import PackageCreateScreen from '@/features/admin/screens/PackageCreateScreen';
import PackageDetailScreen from '@/features/admin/screens/PackageDetailScreen';
import PackageEditScreen from '@/features/admin/screens/PackageEditScreen';
import InvoiceDetailScreen from '@/features/admin/screens/InvoiceDetailScreen';
import PaymentDetailScreen from '@/features/admin/screens/PaymentDetailScreen';
import AdminReportsScreen from '@/features/admin/screens/AdminReportsScreen';
import FinancialReportScreen from '@/features/admin/screens/FinancialReportScreen';
import CustomerReportScreen from '@/features/admin/screens/CustomerReportScreen';
import ComplaintReportScreen from '@/features/admin/screens/ComplaintReportScreen';
import TechnicianReportScreen from '@/features/admin/screens/TechnicianReportScreen';
import ServiceAreasScreen from '@/features/admin/screens/ServiceAreasScreen';
import SubscriptionDetailScreen from '@/features/admin/screens/SubscriptionDetailScreen';
import TechniciansScreen from '@/features/admin/screens/TechniciansScreen';
import TechnicianDetailScreen from '@/features/admin/screens/TechnicianDetailScreen';
import TechnicianAssignmentScreen from '@/features/admin/screens/TechnicianAssignmentScreen';
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
      <Stack.Screen name="AdminPayments" component={AdminBillingScreen} />
      <Stack.Screen name="Billing" component={AdminBillingScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <Stack.Screen name="Technicians" component={TechniciansScreen} />
      <Stack.Screen
        name="TechnicianDetail"
        component={TechnicianDetailScreen}
      />
      <Stack.Screen
        name="TechnicianAssignment"
        component={TechnicianAssignmentScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="ServiceAreas" component={ServiceAreasScreen} />
      <Stack.Screen name="Reports" component={AdminReportsScreen} />
      <Stack.Screen name="AuditTrail" component={AdminAuditScreen} />
      <Stack.Screen name="FinancialReport" component={FinancialReportScreen} />
      <Stack.Screen name="CustomerReport" component={CustomerReportScreen} />
      <Stack.Screen name="ComplaintReport" component={ComplaintReportScreen} />
      <Stack.Screen
        name="TechnicianReport"
        component={TechnicianReportScreen}
      />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen
        name="CustomerEdit"
        component={CustomerEditScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name="CustomerPackageChange"
        component={CustomerPackageChangeScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen
        name="PackageCreate"
        component={PackageCreateScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name="PackageEdit"
        component={PackageEditScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen name="Subscriptions" component={AdminSubscriptionsScreen} />
      <Stack.Screen
        name="SubscriptionDetail"
        component={SubscriptionDetailScreen}
      />
    </Stack.Navigator>
  );
}
