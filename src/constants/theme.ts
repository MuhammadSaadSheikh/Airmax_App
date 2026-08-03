export const colors = {
  background: '#050B1E', surface: '#0B1733', surface2: '#101F40', border: '#20365E',
  primary: '#00C8FF', electric: '#1976FF', text: '#F7FAFF', muted: '#8DA2C8',
  success: '#34D399', warning: '#FBBF24', danger: '#FB7185', purple: '#9D7CFF',
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
  display: 'SpaceGrotesk_700Bold',
} as const;

export const layout = {
  maxContentWidth: 760,
  maxWideContentWidth: 920,
  compactBreakpoint: 360,
  tabletBreakpoint: 768,
} as const;

export const money = (value: number) => `Rs. ${value.toLocaleString('en-PK')}`;
