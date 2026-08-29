import {
  dashboardAlerts,
  dashboardPlan,
} from '../src/services/dashboard/dashboardSummary';
import type { Invoice } from '../src/services/billing/models';
import type { CurrentPackageSnapshot } from '../src/services/packages/models';
import type { Complaint } from '../src/services/support/models';

const currentPackage: CurrentPackageSnapshot = {
  package: {
    id: 'package-1',
    name: 'Fiber 100',
    speed: 100,
    price: 3500,
    billingCycle: 'monthly',
    features: [],
    benefits: [],
    usersSupported: 8,
    isRecommended: false,
    category: 'premium',
    description: 'Production package',
    faqs: [],
  },
  subscription: {
    id: 'subscription-1',
    customerId: 'customer-1',
    packageId: 'package-1',
    activationDate: '2026-08-01T00:00:00.000Z',
    expiryDate: '2026-09-01T00:00:00.000Z',
    status: 'active',
    remainingDays: 3,
  },
};

const invoice: Invoice = {
  id: 'invoice-1',
  invoiceNumber: 'INV-1001',
  customerId: 'customer-1',
  subscriptionId: 'subscription-1',
  amount: 3500,
  date: '2026-08-01T00:00:00.000Z',
  dueDate: '2026-08-25T00:00:00.000Z',
  status: 'overdue',
  billingPeriod: 'monthly',
  billingStart: '2026-08-01T00:00:00.000Z',
  billingEnd: '2026-08-31T23:59:59.000Z',
  customerName: 'Customer',
  customerContact: null,
  packageName: 'Fiber 100',
  packageSpeedMbps: 100,
  paidAt: null,
  cancelledAt: null,
  items: [],
};

const complaint: Complaint = {
  id: 'complaint-1',
  category: 'internet',
  title: 'Connection unavailable',
  description: 'No signal',
  status: 'assigned',
  createdAt: '2026-08-28T00:00:00.000Z',
  updatedAt: '2026-08-28T01:00:00.000Z',
};

describe('Phase 4.4G production dashboard summary', () => {
  it('maps the production subscription into the existing current-plan UI', () => {
    expect(dashboardPlan(currentPackage)).toEqual({
      id: 'package-1',
      name: 'Fiber 100',
      speedMbps: 100,
      monthlyPrice: 3500,
      billingCycle: 'monthly',
      expiryDate: '1 Sept 2026',
      remainingDays: 3,
    });
  });

  it('derives alerts only from production billing and complaint data', () => {
    expect(dashboardAlerts([invoice], [complaint])).toEqual([
      expect.objectContaining({
        id: 'invoice-invoice-1',
        title: 'Bill overdue',
        tone: 'danger',
      }),
      expect.objectContaining({
        id: 'complaint-complaint-1',
        title: 'Complaint update',
        tone: 'info',
      }),
    ]);
    expect(dashboardAlerts([], [])).toEqual([]);
  });
});
