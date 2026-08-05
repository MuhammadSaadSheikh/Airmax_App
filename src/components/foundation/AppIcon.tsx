import Ionicons from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { colors } from '@/theme';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];
export type AppIconProps = Omit<ComponentProps<typeof Ionicons>, 'name'> & {
  name: AppIconName;
};

export function AppIcon({
  color = colors.text,
  size = 20,
  ...props
}: AppIconProps) {
  return <Ionicons {...props} color={color} size={size} />;
}
