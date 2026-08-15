import { mockCustomers } from './customers.mock';
import { mockAdminPackages } from './packages.mock';
import type {
  ApiSubscriptionStatus,
  SubscriptionDto,
} from './subscriptions.models';

type Seed = {
  id: string;
  customerId: string;
  packageId: string;
  status: ApiSubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  updatedAt: string;
  note: string;
};

const seeds: Seed[] = [
  {
    id: 'sub-u1',
    customerId: 'u1',
    packageId: 'premium',
    status: 'ACTIVE',
    startsAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-08-31T23:59:59.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    note: 'Subscription activated',
  },
  {
    id: 'sub-u2',
    customerId: 'u2',
    packageId: 'plus',
    status: 'EXPIRED',
    startsAt: '2026-07-01T00:00:00.000Z',
    expiresAt: '2026-07-31T23:59:59.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    note: 'Subscription expired',
  },
  {
    id: 'sub-u3',
    customerId: 'u3',
    packageId: 'ultra',
    status: 'SUSPENDED',
    startsAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-08-31T23:59:59.000Z',
    updatedAt: '2026-08-05T14:10:00.000Z',
    note: 'Subscription suspended',
  },
];

export const mockSubscriptions: SubscriptionDto[] = seeds.map(seed => {
  const customer = mockCustomers.find(item => item.id === seed.customerId);
  const packageItem = mockAdminPackages.find(
    item => item.id === seed.packageId,
  );
  if (!customer || !packageItem) {
    throw new Error('Invalid mock subscription relation');
  }
  return {
    id: seed.id,
    userId: customer.id,
    packageId: packageItem.id,
    status: seed.status,
    startsAt: seed.startsAt,
    expiresAt: seed.expiresAt,
    pppoeUsername: customer.connectionId?.toLowerCase() ?? null,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      connectionId: customer.connectionId,
    },
    package: {
      id: packageItem.id,
      name: packageItem.name,
      speedMbps: packageItem.speedMbps,
      price: packageItem.price,
      durationDays: packageItem.durationDays,
      description: packageItem.description,
      features: [...packageItem.features],
      status: packageItem.status,
    },
    history: [
      {
        id: `history-${seed.id}-1`,
        subscriptionId: seed.id,
        status: seed.status,
        packageId: packageItem.id,
        packageName: packageItem.name,
        note: seed.note,
        createdAt: seed.updatedAt,
      },
    ],
    createdAt: seed.startsAt,
    updatedAt: seed.updatedAt,
  };
});
