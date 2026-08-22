jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import {
  aggregateReportFilterOptions,
  aggregateReportMetrics,
  type ReportingSnapshotFacts,
} from '@/services/api/reports.aggregator';
import {
  prepareReportCsvExport,
  serializeReportCsv,
} from '@/services/api/reports.export';
import { mapReportsFoundation } from '@/services/api/reports.mapper';
import {
  createFixedReportingClock,
  createReportMetadata,
} from '@/services/api/reporting.clock';
import {
  reportingPresetRange,
  resolveTimezoneAwareRange,
} from '@/services/api/reporting.timezone';
import type { ReportDateRange } from '@/services/api/reports.models';

const range: ReportDateRange = {
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-31T23:59:59.999Z',
};

function facts(): ReportingSnapshotFacts {
  return {
    packages: [
      { id: 'basic', name: 'Basic' },
      { id: 'premium', name: 'Premium' },
    ],
    customers: [
      {
        id: 'customer-1',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: '2026-08-02T00:00:00.000Z',
      },
      {
        id: 'customer-2',
        role: 'CUSTOMER',
        status: 'SUSPENDED',
        createdAt: '2026-08-03T00:00:00.000Z',
      },
    ],
    subscriptions: [
      {
        userId: 'customer-1',
        status: 'ACTIVE',
        packageId: 'premium',
        history: [],
      },
      {
        userId: 'customer-2',
        status: 'ACTIVE',
        packageId: 'basic',
        history: [],
      },
    ],
    invoices: [
      {
        id: 'invoice-1',
        customerId: 'customer-1',
        status: 'PAID',
        amount: 100,
        billingPeriodStart: '2026-08-01T00:00:00.000Z',
        subscription: { packageId: 'premium', packageName: 'Premium' },
      },
      {
        id: 'invoice-2',
        customerId: 'customer-2',
        status: 'PAID',
        amount: 50,
        billingPeriodStart: '2026-08-01T00:00:00.000Z',
        subscription: { packageId: 'basic', packageName: 'Basic' },
      },
    ],
    payments: [
      {
        invoiceId: 'invoice-1',
        status: 'SUCCESSFUL',
        amount: 100,
        createdAt: '2026-08-05T00:00:00.000Z',
        processedAt: '2026-08-05T00:01:00.000Z',
      },
      {
        invoiceId: 'invoice-2',
        status: 'SUCCESSFUL',
        amount: 50,
        createdAt: '2026-08-05T00:00:00.000Z',
        processedAt: '2026-08-05T00:01:00.000Z',
      },
    ],
    complaints: [
      {
        userId: 'customer-1',
        status: 'PENDING',
        category: 'Connectivity',
        createdAt: '2026-08-05T00:00:00.000Z',
        resolvedAt: null,
      },
      {
        userId: 'customer-2',
        status: 'PENDING',
        category: 'Billing',
        createdAt: '2026-08-06T00:00:00.000Z',
        resolvedAt: null,
      },
    ],
    technicians: [
      {
        id: 'tech-1',
        capacity: 2,
        area: { id: 'central', name: 'Karachi Central' },
      },
      {
        id: 'tech-2',
        capacity: 3,
        area: { id: 'south', name: 'Karachi South' },
      },
    ],
    workOrders: [
      { technicianId: 'tech-1', status: 'IN_PROGRESS', completedAt: null },
      { technicianId: 'tech-2', status: 'IN_PROGRESS', completedAt: null },
    ],
  };
}

describe('Phase 3G.3 reporting enhancement foundation', () => {
  it('calculates current-month boundaries in the reporting timezone', () => {
    expect(
      reportingPresetRange(
        'current_month',
        '2026-08-22T10:00:00.000Z',
        'Asia/Karachi',
      ),
    ).toEqual({
      from: '2026-07-31T19:00:00.000Z',
      to: '2026-08-22T10:00:00.000Z',
    });

    const metadata = createReportMetadata(
      { timezone: 'Asia/Karachi' },
      createFixedReportingClock('2026-08-22T10:00:00.000Z'),
      'mock',
    );
    expect(metadata.from).toBe('2026-07-31T19:00:00.000Z');
    expect(metadata.timezone).toBe('Asia/Karachi');
    expect(
      reportingPresetRange(
        'current_month',
        '2026-08-22T10:00:00.000Z',
        'America/Los_Angeles',
      ).from,
    ).toBe('2026-08-01T07:00:00.000Z');
  });

  it('converts custom calendar dates to inclusive timezone boundaries', () => {
    expect(
      resolveTimezoneAwareRange(
        {
          from: '2026-08-01',
          to: '2026-08-02',
          timezone: 'Asia/Karachi',
        },
        '2026-08-22T10:00:00.000Z',
      ),
    ).toEqual({
      from: '2026-07-31T19:00:00.000Z',
      to: '2026-08-02T18:59:59.999Z',
    });
    expect(() =>
      resolveTimezoneAwareRange(
        { from: '2026-08-03', to: '2026-08-02', timezone: 'Asia/Karachi' },
        '2026-08-22T10:00:00.000Z',
      ),
    ).toThrow('Report start date must not be after end date');
  });

  it('applies package and linked customer filters without changing ownership', () => {
    const byPackage = aggregateReportMetrics(facts(), range, {
      packageId: 'premium',
    });
    expect(byPackage.subscriptions.activeSubscriptions).toBe(1);
    expect(byPackage.financial.grossBilledAmount.amount).toBe(100);
    expect(byPackage.financial.collectedCash.amount).toBe(100);

    const byCustomer = aggregateReportMetrics(facts(), range, {
      customerStatus: 'SUSPENDED',
    });
    expect(byCustomer.customers.totalCustomers).toBe(1);
    expect(byCustomer.financial.grossBilledAmount.amount).toBe(50);
    expect(byCustomer.complaints.complaintVolume).toBe(1);
  });

  it('applies complaint-category and technician-area filters', () => {
    const metrics = aggregateReportMetrics(facts(), range, {
      complaintCategory: 'Connectivity',
      technicianAreaId: 'central',
    });
    expect(metrics.complaints.categoryDistribution).toEqual([
      { id: 'Connectivity', value: 1 },
    ]);
    expect(metrics.technicians).toMatchObject({
      activeWorkload: 1,
      totalCapacity: 2,
      utilizationPercentage: 50,
    });
    expect(aggregateReportFilterOptions(facts()).technicianAreas).toEqual([
      { id: 'central', label: 'Karachi Central' },
      { id: 'south', label: 'Karachi South' },
    ]);
  });

  it('serializes CSV safely and prepares deterministic report exports', () => {
    expect(
      serializeReportCsv([
        { section: 'customer', metric: 'name', value: 'Ali, "Ahmed"' },
      ]),
    ).toContain('"Ali, ""Ahmed"""');

    const snapshot = facts();
    const metadata = {
      ...range,
      timezone: 'Asia/Karachi',
      currency: 'PKR' as const,
      generatedAt: '2026-08-22T10:00:00.000Z',
      asOf: '2026-08-22T10:00:00.000Z',
      source: 'mock' as const,
    };
    const report = mapReportsFoundation(
      aggregateReportMetrics(snapshot, range),
      metadata,
      aggregateReportFilterOptions(snapshot),
    );
    const prepared = prepareReportCsvExport('financial', report);
    expect(prepared).toMatchObject({
      fileName: 'airmax-financial-report-2026-08-01-2026-08-31.csv',
      mimeType: 'text/csv',
      generatedAt: metadata.generatedAt,
    });
    expect(prepared.content).toContain('financial,gross-billed,150,PKR');
  });

  it('exports a valid header and zero metrics for empty reporting data', () => {
    const empty: ReportingSnapshotFacts = {
      customers: [],
      subscriptions: [],
      invoices: [],
      payments: [],
      complaints: [],
      technicians: [],
      workOrders: [],
    };
    const metadata = {
      ...range,
      timezone: 'Asia/Karachi',
      currency: 'PKR' as const,
      generatedAt: range.to,
      asOf: range.to,
      source: 'mock' as const,
    };
    const report = mapReportsFoundation(
      aggregateReportMetrics(empty, range),
      metadata,
      aggregateReportFilterOptions(empty),
    );
    const prepared = prepareReportCsvExport('customer', report);
    expect(prepared.content.startsWith('section,metric,value,currency')).toBe(
      true,
    );
    expect(prepared.content).toContain('customer,total-customers,0,');
    expect(prepared.rowCount).toBeGreaterThan(0);
  });
});
