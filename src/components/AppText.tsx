import { forwardRef, type ComponentRef } from 'react';
import {
  StyleSheet,
  Text as NativeText,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { fonts } from '@/constants/theme';

function familyFor(style: TextProps['style']) {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flattened?.fontFamily) return flattened.fontFamily;
  const weight = flattened?.fontWeight;
  if (weight === '900' || weight === '800') return fonts.extraBold;
  if (weight === 'bold' || weight === '700') return fonts.bold;
  if (weight === '600') return fonts.semibold;
  if (weight === '500') return fonts.medium;
  return fonts.regular;
}

export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  function AppText({ style, ...props }, ref) {
    const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
    return (
      <NativeText
        ref={ref}
        {...props}
        style={[
          style,
          {
            fontFamily: familyFor(style),
            fontWeight: flattened?.fontFamily ? flattened.fontWeight : 'normal',
          },
        ]}
      />
    );
  },
);
