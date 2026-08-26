declare function require(name: string): unknown;
export {};

describe('Customer service environment isolation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config/environment');
    jest.dontMock('../src/services/api/customer/customer.live.service');
    jest.dontMock('../src/services/api/customer/customer.mock.service');
  });

  it('loads only the production Customer service in live mode', () => {
    let mockInitialized = false;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { useMockApi: false },
      }));
      jest.doMock('../src/services/api/customer/customer.live.service', () => ({
        liveCustomerService: { kind: 'live' },
      }));
      jest.doMock('../src/services/api/customer/customer.mock.service', () => {
        mockInitialized = true;
        return { mockCustomerService: { kind: 'mock' } };
      });
      const selected =
        require('../src/services/api/customer/customer.service') as {
          customerService: { kind: string };
        };
      expect(selected.customerService.kind).toBe('live');
    });
    expect(mockInitialized).toBe(false);
  });

  it('loads only the mock Customer service in mock mode', () => {
    let liveInitialized = false;
    jest.isolateModules(() => {
      jest.doMock('../src/config/environment', () => ({
        environment: { useMockApi: true },
      }));
      jest.doMock('../src/services/api/customer/customer.live.service', () => {
        liveInitialized = true;
        return { liveCustomerService: { kind: 'live' } };
      });
      jest.doMock('../src/services/api/customer/customer.mock.service', () => ({
        mockCustomerService: { kind: 'mock' },
      }));
      const selected =
        require('../src/services/api/customer/customer.service') as {
          customerService: { kind: string };
        };
      expect(selected.customerService.kind).toBe('mock');
    });
    expect(liveInitialized).toBe(false);
  });
});
