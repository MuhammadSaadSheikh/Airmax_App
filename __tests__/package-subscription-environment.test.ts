declare function require(name: string): unknown;
export {};

describe('Package and subscription environment isolation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config/environment');
    jest.dontMock('../src/services/api/package/package.live.service');
    jest.dontMock('../src/services/api/package/package.mock.service');
    jest.dontMock('../src/services/api/subscription/subscription.live.service');
    jest.dontMock('../src/services/api/subscription/subscription.mock.service');
  });

  it.each([
    [
      'package',
      '../src/services/api/package/package.service',
      'packageCatalogService',
      '../src/services/api/package/package.live.service',
      'livePackageCatalogService',
      '../src/services/api/package/package.mock.service',
      'mockPackageCatalogService',
    ],
    [
      'subscription',
      '../src/services/api/subscription/subscription.service',
      'customerSubscriptionService',
      '../src/services/api/subscription/subscription.live.service',
      'liveCustomerSubscriptionService',
      '../src/services/api/subscription/subscription.mock.service',
      'mockCustomerSubscriptionService',
    ],
  ])(
    'loads only live %s service outside mock mode',
    (
      _label,
      selectorPath,
      exportName,
      livePath,
      liveExport,
      mockPath,
      mockExport,
    ) => {
      let mockInitialized = false;
      jest.isolateModules(() => {
        jest.doMock('../src/config/environment', () => ({
          environment: { useMockApi: false },
        }));
        jest.doMock(livePath, () => ({ [liveExport]: { kind: 'live' } }));
        jest.doMock(mockPath, () => {
          mockInitialized = true;
          return { [mockExport]: { kind: 'mock' } };
        });
        const selected = require(selectorPath) as Record<
          string,
          { kind: string }
        >;
        expect(selected[exportName]?.kind).toBe('live');
      });
      expect(mockInitialized).toBe(false);
    },
  );

  it.each([
    [
      'package',
      '../src/services/api/package/package.service',
      'packageCatalogService',
      '../src/services/api/package/package.live.service',
      'livePackageCatalogService',
      '../src/services/api/package/package.mock.service',
      'mockPackageCatalogService',
    ],
    [
      'subscription',
      '../src/services/api/subscription/subscription.service',
      'customerSubscriptionService',
      '../src/services/api/subscription/subscription.live.service',
      'liveCustomerSubscriptionService',
      '../src/services/api/subscription/subscription.mock.service',
      'mockCustomerSubscriptionService',
    ],
  ])(
    'loads only mock %s service in mock mode',
    (
      _label,
      selectorPath,
      exportName,
      livePath,
      liveExport,
      mockPath,
      mockExport,
    ) => {
      let liveInitialized = false;
      jest.isolateModules(() => {
        jest.doMock('../src/config/environment', () => ({
          environment: { useMockApi: true },
        }));
        jest.doMock(livePath, () => {
          liveInitialized = true;
          return { [liveExport]: { kind: 'live' } };
        });
        jest.doMock(mockPath, () => ({ [mockExport]: { kind: 'mock' } }));
        const selected = require(selectorPath) as Record<
          string,
          { kind: string }
        >;
        expect(selected[exportName]?.kind).toBe('mock');
      });
      expect(liveInitialized).toBe(false);
    },
  );
});
