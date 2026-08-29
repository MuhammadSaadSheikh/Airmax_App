declare function require(name: string): unknown;
export {};

describe('Phase 4.4G production boundary enforcement', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config/environment');
    jest.dontMock('../src/services/api/client');
    jest.dontMock('../src/services/notifications/notification.live.service');
    jest.dontMock('../src/services/notifications/notification.mock.service');
  });

  it('does not load notification mock data in live mode', () => {
    let mockInitialized = false;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { useMockApi: false },
      }));
      jest.doMock(
        '../src/services/notifications/notification.live.service',
        () => ({ liveNotificationService: { kind: 'live' } }),
      );
      jest.doMock(
        '../src/services/notifications/notification.mock.service',
        () => {
          mockInitialized = true;
          return { mockNotificationService: { kind: 'mock' } };
        },
      );
      const selected =
        require('../src/services/notifications/notificationService') as {
          notificationService: { kind: string };
        };
      expect(selected.notificationService.kind).toBe('live');
    });
    expect(mockInitialized).toBe(false);
  });

  it('keeps pre-auth mock and authenticated package caches separate', () => {
    const { queryKeys } = require('../src/services/query/queryKeys') as {
      queryKeys: {
        installationPackageCatalogue: readonly unknown[];
        packageMarketplace: readonly unknown[];
      };
    };
    expect(queryKeys.installationPackageCatalogue).not.toEqual(
      queryKeys.packageMarketplace,
    );
  });

  it('blocks live installation submission without making an API request', async () => {
    const apiRequest = jest.fn();
    let service: {
      supportsSubmission: boolean;
      create(input: unknown): Promise<unknown>;
    } | null = null;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { useMockApi: false },
      }));
      jest.doMock('../src/services/api/client', () => ({
        apiRequest,
        mockDelay: jest.fn(() => Promise.resolve()),
      }));
      service = (
        require('../src/services/api/installations.service') as {
          installationsService: typeof service;
        }
      ).installationsService;
    });

    expect(service!.supportsSubmission).toBe(false);
    await expect(
      service!.create({
        name: 'Customer',
        phone: '03000000000',
        address: 'Karachi',
        packageId: 'basic',
        date: '2026-09-01',
      }),
    ).rejects.toThrow('public backend contract');
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('rejects network mock services in live mode', async () => {
    let getHealth: ((connectionId: string) => Promise<unknown>) | undefined;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { useMockApi: false },
      }));
      getHealth = (
        require('../src/services/network/networkHealthService') as {
          networkHealthService: {
            getHealth(connectionId: string): Promise<unknown>;
          };
        }
      ).networkHealthService.getHealth;
    });
    await expect(getHealth!('AMX-1042')).rejects.toThrow('live mode');
  });
});
