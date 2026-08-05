import { StyleSheet } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { AppIcon, type AppIconName } from '@/components';
import { colors, fonts } from '@/theme';
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

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
});
