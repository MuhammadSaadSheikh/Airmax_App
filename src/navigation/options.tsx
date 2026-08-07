import { StyleSheet } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { AppIcon, type AppIconName } from '@/components';
import { colors, fonts } from '@/theme';
import { animation } from '@/theme';
import { getTabMetrics } from '@/utils/responsive';

export function createTabOptions(
  icons: Record<string, AppIconName>,
  width: number,
  bottomInset: number,
): ({ route }: { route: { name: string } }) => BottomTabNavigationOptions {
  const metrics = getTabMetrics(width, bottomInset);
  return ({ route }) => ({
    headerShown: false,
    tabBarHideOnKeyboard: true,
    sceneStyle: styles.scene,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.mutedStrong,
    tabBarStyle: {
      backgroundColor: colors.navigation,
      borderTopColor: colors.border,
      height: metrics.height,
      paddingTop: 7,
      paddingBottom: metrics.safeBottom,
    },
    tabBarLabelStyle: {
      fontFamily: fonts.semibold,
      fontSize: metrics.labelSize,
    },
    tabBarIcon: ({ color, size }) => (
      <AppIcon
        name={icons[route.name] ?? 'ellipse'}
        size={size}
        color={color}
      />
    ),
  });
}

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right',
  animationDuration: animation.duration.normal,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

export const modalScreenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  animationDuration: animation.duration.normal,
  presentation: 'modal',
  gestureEnabled: true,
};

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
});
