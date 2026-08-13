import { resolveEnvironment } from '../src/config/environment';

describe('build environment selection', () => {
  it.each([
    ['mock', 'mock', true],
    ['development-live', 'live', false],
    ['staging', 'live', false],
    ['production', 'live', false],
  ] as const)('resolves %s explicitly', (name, authMode, allowsMockAuth) => {
    expect(resolveEnvironment(name, 'ios')).toMatchObject({
      name,
      authMode,
      allowsMockAuth,
    });
  });

  it('fails closed for missing and unknown configuration', () => {
    expect(() => resolveEnvironment(undefined)).toThrow();
    expect(() => resolveEnvironment('debug')).toThrow();
  });

  it('uses HTTPS for staging and production', () => {
    expect(resolveEnvironment('staging').apiUrl).toMatch(/^https:/);
    expect(resolveEnvironment('production').apiUrl).toMatch(/^https:/);
  });
});
