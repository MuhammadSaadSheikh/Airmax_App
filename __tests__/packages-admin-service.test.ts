jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import { packageInformationSchema } from '@/features/admin/package.schema';
import { customersService } from '@/services/api/customers.service';
import { mockCustomerRepository } from '@/services/api/customers.mock.repository';
import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { packagesService } from '@/services/api/packages.service';
import type { CreatePackageInput } from '@/services/api/packages.models';

const newPackage: CreatePackageInput = {
  name: 'Business Connect',
  speedMbps: 150,
  price: 4800,
  durationDays: 45,
  description: 'Connectivity for small offices.',
  features: ['Static IP', 'Priority support'],
};

describe('Phase 3D admin package management', () => {
  beforeEach(() => {
    mockPackageRepository.reset();
    mockCustomerRepository.reset();
  });

  it('lists the canonical admin package catalogue', async () => {
    const packages = await packagesService.list();

    expect(packages.map(item => item.name)).toEqual([
      'Basic',
      'Air Plus',
      'Premium',
      'Ultra Fiber',
    ]);
  });

  it('looks up package details with aggregate subscriber count', async () => {
    const packageItem = await packagesService.getById('premium');

    expect(packageItem).toEqual(
      expect.objectContaining({
        name: 'Premium',
        subscriberCount: 265,
      }),
    );
  });

  it('creates and persists a package with a stable mock ID', async () => {
    const created = await packagesService.create(newPackage);
    const found = await packagesService.getById(created.id);
    const packages = await packagesService.list();

    expect(created.id).toBe('mock-package-1');
    expect(created.status).toBe('active');
    expect(created.subscriberCount).toBe(0);
    expect(found).toEqual(created);
    expect(packages).toContainEqual(created);
  });

  it('makes a newly created active package available for admin assignment', async () => {
    const created = await packagesService.create(newPackage);
    const options = await customersService.listPackageOptions();

    expect(options).toContainEqual(
      expect.objectContaining({ id: created.id, status: 'active' }),
    );
    await expect(
      customersService.changePackage({
        customerId: 'u1',
        packageId: created.id,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        latestSubscription: expect.objectContaining({
          package: expect.objectContaining({ id: created.id }),
        }),
      }),
    );
  });

  it('rejects package names case-insensitively', async () => {
    await expect(
      packagesService.create({ ...newPackage, name: '  premium  ' }),
    ).rejects.toThrow('already exists');
  });

  it('updates editable fields without changing subscriber totals', async () => {
    const updated = await packagesService.update({
      packageId: 'plus',
      ...newPackage,
      name: 'Air Plus Business',
      features: ['First feature', 'Second feature'],
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: 'plus',
        name: 'Air Plus Business',
        speedMbps: 150,
        subscriberCount: 487,
        features: ['First feature', 'Second feature'],
      }),
    );
  });

  it('does not rewrite existing subscription terms after catalogue edits', async () => {
    const originalSubscription =
      mockCustomerRepository.getById('u1')!.subscriptions[0]!;

    await packagesService.update({
      packageId: 'premium',
      ...newPackage,
      name: 'Premium',
      price: 4200,
      speedMbps: 125,
    });
    await packagesService.deactivate('premium');

    const existingSubscription =
      mockCustomerRepository.getById('u1')!.subscriptions[0]!;
    expect(existingSubscription.package.price).toBe(
      originalSubscription.package.price,
    );
    expect(existingSubscription.package.speedMbps).toBe(
      originalSubscription.package.speedMbps,
    );
    expect(existingSubscription.package.durationDays).toBe(
      originalSubscription.package.durationDays,
    );
    expect(existingSubscription.package.status).toBe('ACTIVE');
  });

  it('deactivates and reactivates packages', async () => {
    await expect(packagesService.deactivate('basic')).resolves.toEqual(
      expect.objectContaining({ status: 'inactive' }),
    );
    await expect(packagesService.activate('basic')).resolves.toEqual(
      expect.objectContaining({ status: 'active' }),
    );
  });

  it('prevents assigning an inactive package to a customer', async () => {
    await packagesService.deactivate('premium');

    await expect(
      customersService.changePackage({
        customerId: 'u1',
        packageId: 'premium',
      }),
    ).rejects.toThrow('Inactive packages cannot be assigned');
    await expect(
      customersService.listPackageOptions(),
    ).resolves.not.toContainEqual(expect.objectContaining({ id: 'premium' }));
  });

  it('returns defensive copies', () => {
    const firstRead = mockPackageRepository.list();
    firstRead[0]!.name = 'Mutated outside repository';
    firstRead[0]!.features.push('Injected feature');

    const secondRead = mockPackageRepository.list();
    expect(secondRead[0]!.name).toBe('Basic');
    expect(secondRead[0]!.features).not.toContain('Injected feature');
  });

  it('resets mutable state and ID generation', () => {
    mockPackageRepository.create(newPackage);
    mockPackageRepository.deactivate('basic');
    mockPackageRepository.reset();

    expect(mockPackageRepository.getById('mock-package-1')).toBeUndefined();
    expect(mockPackageRepository.getById('basic')?.status).toBe('ACTIVE');
    expect(mockPackageRepository.create(newPackage).id).toBe('mock-package-1');
  });

  it('rejects permanent deletion', () => {
    expect(() => mockPackageRepository.removePermanently()).toThrow(
      'Permanent package deletion is not supported',
    );
  });

  it('validates required and positive package fields', () => {
    const invalid = packageInformationSchema.safeParse({
      name: '',
      speedMbps: '0',
      price: '-1',
      durationDays: '0',
      description: '',
      features: '\n ',
    });
    const valid = packageInformationSchema.safeParse({
      name: 'Business Connect',
      speedMbps: '150',
      price: '4800',
      durationDays: '45',
      description: '',
      features: 'Static IP\nPriority support',
    });

    expect(invalid.success).toBe(false);
    expect(valid.success).toBe(true);
  });
});
