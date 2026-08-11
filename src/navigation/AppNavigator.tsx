import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@/features/auth/screens/SplashScreen';
import { colors } from '@/theme';
import { AdminNavigator } from './AdminNavigator';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';
import { useAuthStore } from '@/store/auth.store';
import { resolveAuthRoot } from './authRoot';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export function AppNavigator() {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const root = resolveAuthRoot(status, user);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} key={root}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {root === 'Splash' ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : root === 'Auth' ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : root === 'Admin' ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : (
          <Stack.Screen name="Customer" component={CustomerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
