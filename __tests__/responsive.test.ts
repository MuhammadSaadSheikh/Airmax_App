import { getScreenMetrics, getTabMetrics } from '../src/utils/responsive';

describe('responsive layout metrics', () => {
  it('keeps compact phones usable', () => {
    expect(getScreenMetrics(320, 0)).toMatchObject({
      horizontalPadding: 14,
      maxWidth: 760,
      bottomPadding: 20,
    });
    expect(getTabMetrics(320, 0)).toEqual({
      safeBottom: 10,
      height: 71,
      labelSize: 9,
    });
  });

  it('caps tablet content and includes Android navigation insets', () => {
    expect(getScreenMetrics(1280, 32)).toMatchObject({
      horizontalPadding: 28,
      maxWidth: 920,
      bottomPadding: 32,
    });
    expect(getTabMetrics(1280, 32)).toEqual({
      safeBottom: 32,
      height: 93,
      labelSize: 10,
    });
  });
});
