const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { NetworkError } from '../src/services/api/errors';
import { livePackageCatalogService } from '../src/services/api/package/package.live.service';
import { mapPackageDto } from '../src/services/api/package/package.mapper';
import type { PackageDto } from '../src/services/api/package/package.models';

const activePackage: PackageDto = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Premium Fiber',
  description: 'High-speed connectivity.',
  speedMbps: 100,
  price: '3500.00',
  billingPeriod: 'MONTHLY',
  features: ['4K streaming', 'Priority support'],
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
};

describe('Phase 4.4D production package catalogue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the authenticated active package catalogue', async () => {
    mockApiRequest.mockResolvedValue([
      activePackage,
      { ...activePackage, id: 'inactive-package', status: 'INACTIVE' },
    ]);
    await expect(livePackageCatalogService.getPackages()).resolves.toEqual([
      expect.objectContaining({
        id: activePackage.id,
        speed: 100,
        price: 3500,
        billingCycle: 'monthly',
      }),
    ]);
    expect(mockApiRequest).toHaveBeenCalledWith('/packages');
  });

  it('fetches active package details by catalogue ID', async () => {
    mockApiRequest.mockResolvedValue(activePackage);
    await expect(
      livePackageCatalogService.getPackageById(activePackage.id),
    ).resolves.toMatchObject({ id: activePackage.id, name: 'Premium Fiber' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/packages/${activePackage.id}`,
    );
  });

  it('does not expose inactive package details to customer UI', async () => {
    mockApiRequest.mockResolvedValue({
      ...activePackage,
      status: 'INACTIVE',
    });
    await expect(
      livePackageCatalogService.getPackageById(activePackage.id),
    ).resolves.toBeUndefined();
  });

  it('supports an empty active catalogue', async () => {
    mockApiRequest.mockResolvedValue([]);
    await expect(livePackageCatalogService.getPackages()).resolves.toEqual([]);
  });

  it('maps all production billing periods into the existing UI contract', () => {
    expect(
      ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'].map(
        billingPeriod =>
          mapPackageDto({
            ...activePackage,
            billingPeriod: billingPeriod as
              'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL',
          }).billingCycle,
      ),
    ).toEqual(['monthly', 'quarterly', 'semi-annual', 'yearly']);
  });

  it('preserves normalized API errors', async () => {
    const error = new NetworkError('Offline', undefined);
    mockApiRequest.mockRejectedValue(error);
    await expect(livePackageCatalogService.getPackages()).rejects.toBe(error);
  });
});
