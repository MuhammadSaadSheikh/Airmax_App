import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';
import InstallationRequestScreen from '@/features/auth/screens/InstallationRequestScreen';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import OtpScreen from '@/features/auth/screens/OtpScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="InstallationRequest"
        component={InstallationRequestScreen}
      />
    </Stack.Navigator>
  );
}
