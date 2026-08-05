import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';
import { colors, fonts } from '@/theme';

export type AppTextProps = PropsWithChildren<TextProps>;

export function AppText({ style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[{ color: colors.text, fontFamily: fonts.regular }, style]}
    />
  );
}
