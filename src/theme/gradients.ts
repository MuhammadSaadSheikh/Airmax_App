import { colors } from './colors';

export const gradients = {
  primary: [colors.electric, colors.primary] as const,
  internetStatus: [colors.primaryDark, colors.primaryMid] as const,
  splashOverlay: [
    colors.overlaySoft,
    colors.overlaySubtle,
    colors.overlayStrong,
  ] as const,
  networkBackground: [
    colors.background,
    colors.surfaceStrong,
    colors.background,
  ] as const,
} as const;
