import Ionicons from '@react-native-vector-icons/ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Splash from '../../app/index';
import Login from '../../app/(auth)/login';
import OTP from '../../app/(auth)/otp';
import ForgotPassword from '../../app/(auth)/forgot';
import CustomerHome from '../../app/(customer)/index';
import Packages from '../../app/(customer)/packages';
import Billing from '../../app/(customer)/billing';
import Support from '../../app/(customer)/support';
import Profile from '../../app/(customer)/profile';
import AdminDashboard from '../../app/(admin)/index';
import Customers from '../../app/(admin)/customers';
import AdminPackages from '../../app/(admin)/packages';
import AdminComplaints from '../../app/(admin)/complaints';
import AdminMore from '../../app/(admin)/more';
import ActivePackage from '../../app/customer/package';
import PackageDetail from '../../app/customer/package-detail';
import Payment from '../../app/customer/payment';
import NewComplaint from '../../app/customer/complaint-new';
import Notifications from '../../app/customer/notifications';
import EditProfile from '../../app/customer/edit-profile';
import InstallationRequest from '../../app/customer/install';
import AdminPayments from '../../app/admin/payments';
import Technicians from '../../app/admin/technicians';
import ServiceAreas from '../../app/admin/areas';
import Reports from '../../app/admin/reports';
import CustomerForm from '../../app/admin/customer-form';
import CustomerDetail from '../../app/admin/customer-detail';
import PackageForm from '../../app/admin/package-form';
import ComplaintDetail from '../../app/admin/complaint-detail';
import { colors, fonts } from '@/constants/theme';
import { getTabMetrics } from '@/utils/responsive';
import { navigationRef } from './router';

const Root = createNativeStackNavigator();
const CustomerTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

const customerIcons: Record<string, string> = {
  Home: 'home', Packages: 'speedometer', Billing: 'receipt', Support: 'headset', Profile: 'person',
};
const adminIcons: Record<string, string> = {
  Overview: 'grid', Customers: 'people', Packages: 'speedometer', Complaints: 'chatbox-ellipses', More: 'menu',
};

function tabOptions(icons: Record<string, string>, width: number, bottom: number) {
  const metrics = getTabMetrics(width, bottom);
  return ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarHideOnKeyboard: true,
    sceneStyle: { backgroundColor: colors.background },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: '#63789D',
    tabBarStyle: {
      backgroundColor: '#07142B', borderTopColor: colors.border, height: metrics.height,
      paddingTop: 7, paddingBottom: metrics.safeBottom,
    },
    tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: metrics.labelSize },
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={(icons[route.name] ?? 'ellipse') as never} size={size} color={color} />
    ),
  });
}

function CustomerTabs() {
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  return <CustomerTab.Navigator screenOptions={tabOptions(customerIcons, width, insets.bottom)}><CustomerTab.Screen name="Home" component={CustomerHome}/><CustomerTab.Screen name="Packages" component={Packages}/><CustomerTab.Screen name="Billing" component={Billing}/><CustomerTab.Screen name="Support" component={Support}/><CustomerTab.Screen name="Profile" component={Profile}/></CustomerTab.Navigator>;
}

function AdminTabs() {
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  return <AdminTab.Navigator screenOptions={tabOptions(adminIcons, width, insets.bottom)}><AdminTab.Screen name="Overview" component={AdminDashboard}/><AdminTab.Screen name="Customers" component={Customers}/><AdminTab.Screen name="Packages" component={AdminPackages}/><AdminTab.Screen name="Complaints" component={AdminComplaints}/><AdminTab.Screen name="More" component={AdminMore}/></AdminTab.Navigator>;
}

const details = [
  ['ActivePackage', ActivePackage], ['PackageDetail', PackageDetail], ['Payment', Payment],
  ['NewComplaint', NewComplaint], ['Notifications', Notifications], ['EditProfile', EditProfile],
  ['InstallationRequest', InstallationRequest], ['AdminPayments', AdminPayments], ['Technicians', Technicians],
  ['ServiceAreas', ServiceAreas], ['Reports', Reports], ['CustomerForm', CustomerForm],
  ['CustomerDetail', CustomerDetail], ['PackageForm', PackageForm], ['ComplaintDetail', ComplaintDetail],
] as const;

export function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Root.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerTitleStyle: { fontFamily: fonts.semibold }, contentStyle: { backgroundColor: colors.background } }}>
        <Root.Screen name="Splash" component={Splash} options={{ headerShown: false }}/>
        <Root.Screen name="Login" component={Login} options={{ headerShown: false }}/>
        <Root.Screen name="OTP" component={OTP} options={{ headerShown: false }}/>
        <Root.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }}/>
        <Root.Screen name="CustomerPortal" component={CustomerTabs} options={{ headerShown: false }}/>
        <Root.Screen name="AdminPortal" component={AdminTabs} options={{ headerShown: false }}/>
        {details.map(([name, component]) => <Root.Screen key={name} name={name} component={component}/>) }
      </Root.Navigator>
    </NavigationContainer>
  );
}
