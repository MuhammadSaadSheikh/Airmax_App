import type { TextStyle } from 'react-native';

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
  display: 'SpaceGrotesk_700Bold',
} as const;

export const fontSizes = {
  caption: 10,
  footnote: 11,
  small: 12,
  label: 13,
  body: 14,
  bodyLarge: 15,
  subtitle: 18,
  title: 23,
  display: 27,
  hero: 40,
} as const;

export const lineHeights = {
  compact: 16,
  small: 18,
  body: 21,
  title: 30,
  hero: 42,
} as const;

export const typography = {
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.bodyLarge,
    lineHeight: 22,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: lineHeights.small,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.label,
    lineHeight: lineHeights.small,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.subtitle,
    lineHeight: 24,
  },
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: 34,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.bodyLarge,
    lineHeight: 20,
  },
} satisfies Record<string, TextStyle>;
