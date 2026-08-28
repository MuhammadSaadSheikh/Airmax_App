declare function require(name: string): unknown;
export {};

const boundaries = [
  {
    label: 'complaint',
    selectorPath: '../src/services/api/complaint/complaint.service',
    exportName: 'complaintApiService',
    livePath: '../src/services/api/complaint/complaint.live.service',
    liveExport: 'liveComplaintApiService',
    mockPath: '../src/services/api/complaint/complaint.mock.service',
    mockExport: 'mockComplaintApiService',
  },
  {
    label: 'technician visibility',
    selectorPath: '../src/services/api/technician/technician.service',
    exportName: 'technicianVisibilityApiService',
    livePath: '../src/services/api/technician/technician.live.service',
    liveExport: 'liveTechnicianVisibilityApiService',
    mockPath: '../src/services/api/technician/technician.mock.service',
    mockExport: 'mockTechnicianVisibilityApiService',
  },
  {
    label: 'work order tracking',
    selectorPath: '../src/services/api/workOrder/workOrder.service',
    exportName: 'workOrderTrackingApiService',
    livePath: '../src/services/api/workOrder/workOrder.live.service',
    liveExport: 'liveWorkOrderTrackingApiService',
    mockPath: '../src/services/api/workOrder/workOrder.mock.service',
    mockExport: 'mockWorkOrderTrackingApiService',
  },
  {
    label: 'support facade',
    selectorPath: '../src/services/support/supportService',
    exportName: 'supportService',
    livePath: '../src/services/support/support.live.service',
    liveExport: 'liveSupportService',
    mockPath: '../src/services/support/support.mock.service',
    mockExport: 'mockSupportService',
  },
] as const;

describe('Phase 4.4F support environment isolation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/config/environment');
    boundaries.forEach(boundary => {
      jest.dontMock(boundary.livePath);
      jest.dontMock(boundary.mockPath);
    });
  });

  it.each(boundaries)('loads only live $label outside mock mode', boundary => {
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
  });

  it.each(boundaries)('loads only mock $label in mock mode', boundary => {
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
  });
});
