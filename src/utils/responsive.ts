import { layout } from '@/constants/theme';

export function getScreenMetrics(width: number, bottomInset: number) {
  return {
    horizontalPadding:
      width < layout.compactBreakpoint
        ? 14
        : width >= layout.tabletBreakpoint
          ? 28
          : 20,
    maxWidth:
      width >= 1100 ? layout.maxWideContentWidth : layout.maxContentWidth,
    bottomPadding: 20,
    // bottomPadding: Math.max(bottomInset + 12, 24),
  };
}

export function getTabMetrics(width: number, bottomInset: number) {
  const safeBottom = Math.max(bottomInset, 10);
  return {
    safeBottom,
    height: 61 + safeBottom,
    labelSize: width < layout.compactBreakpoint ? 9 : 10,
  };
}
