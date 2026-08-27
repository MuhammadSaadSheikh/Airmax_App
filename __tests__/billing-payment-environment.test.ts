declare function require(name: string): unknown;
export {};

const boundaries = [
  {
    label: 'invoice',
    selectorPath: '../src/services/api/invoice/invoice.service',
    exportName: 'invoiceApiService',
    livePath: '../src/services/api/invoice/invoice.live.service',
    liveExport: 'liveInvoiceApiService',
    mockPath: '../src/services/api/invoice/invoice.mock.service',
    mockExport: 'mockInvoiceApiService',
  },
  {
    label: 'payment',
    selectorPath: '../src/services/api/payment/payment.service',
    exportName: 'paymentApiService',
    livePath: '../src/services/api/payment/payment.live.service',
    liveExport: 'livePaymentApiService',
    mockPath: '../src/services/api/payment/payment.mock.service',
    mockExport: 'mockPaymentApiService',
  },
  {
    label: 'billing facade',
    selectorPath: '../src/services/billing/billingService',
    exportName: 'billingCenterService',
    livePath: '../src/services/billing/billing.live.service',
    liveExport: 'liveBillingCenterService',
    mockPath: '../src/services/billing/billing.mock.service',
    mockExport: 'mockBillingCenterService',
  },
] as const;

describe('Phase 4.4E billing/payment environment isolation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config/environment');
    boundaries.forEach(boundary => {
      jest.dontMock(boundary.livePath);
      jest.dontMock(boundary.mockPath);
    });
  });

  it.each(boundaries)(
    'loads only live $label service outside mock mode',
    boundary => {
      let mockInitialized = false;
      jest.isolateModules(() => {
        jest.doMock('../src/config/environment', () => ({
          environment: { useMockApi: false },
        }));
        jest.doMock(boundary.livePath, () => ({
          [boundary.liveExport]: { kind: 'live' },
        }));
        jest.doMock(boundary.mockPath, () => {
          mockInitialized = true;
          return { [boundary.mockExport]: { kind: 'mock' } };
        });
        const selected = require(boundary.selectorPath) as Record<
          string,
          { kind: string }
        >;
        expect(selected[boundary.exportName]?.kind).toBe('live');
      });
      expect(mockInitialized).toBe(false);
    },
  );

  it.each(boundaries)(
    'loads only mock $label service in mock mode',
    boundary => {
      let liveInitialized = false;
      jest.isolateModules(() => {
        jest.doMock('../src/config/environment', () => ({
          environment: { useMockApi: true },
        }));
        jest.doMock(boundary.livePath, () => {
          liveInitialized = true;
          return { [boundary.liveExport]: { kind: 'live' } };
        });
        jest.doMock(boundary.mockPath, () => ({
          [boundary.mockExport]: { kind: 'mock' },
        }));
        const selected = require(boundary.selectorPath) as Record<
          string,
          { kind: string }
        >;
        expect(selected[boundary.exportName]?.kind).toBe('mock');
      });
      expect(liveInitialized).toBe(false);
    },
  );
});
