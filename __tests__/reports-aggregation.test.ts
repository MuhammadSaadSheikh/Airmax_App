jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

import {
  aggregateCustomerMetrics,
  aggregateReportMetrics,
  type ReportingSnapshotFacts,
} from '@/services/api/reports.aggregator';
import { mockReportsRepository } from '@/services/api/reports.mock.repository';
import { createReportsService } from '@/services/api/reports.service';
import { createFixedReportingClock } from '@/services/api/reporting.clock';
import { mockCustomerRepository } from '@/services/api/customers.mock.repository';
import { mockPackageRepository } from '@/services/api/packages.mock.repository';
import { mockTechnicianRepository } from '@/services/api/technicians.mock.repository';
import type { ReportDateRange } from '@/services/api/reports.models';

const august: ReportDateRange = {
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-31T23:59:59.999Z',
};

function reportingFacts(): ReportingSnapshotFacts {
  return {
    customers: [
      {
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: '2026-08-02T00:00:00.000Z',
      },
      {
        role: 'CUSTOMER',
        status: 'SUSPENDED',
        createdAt: '2026-07-02T00:00:00.000Z',
      },
      {
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: '2026-08-03T00:00:00.000Z',
      },
    ],
    subscriptions: [
      {
        status: 'ACTIVE',
        packageId: 'premium',
        history: [{ status: 'ACTIVE', createdAt: '2026-08-03T00:00:00.000Z' }],
      },
      {
        status: 'CANCELLED',
        packageId: 'basic',
        history: [
          { status: 'CANCELLED', createdAt: '2026-08-04T00:00:00.000Z' },
        ],
      },
    ],
    invoices: [
      {
        status: 'PAID',
        amount: 100,
        billingPeriodStart: '2026-08-01T00:00:00.000Z',
        dueDate: '2026-08-10T00:00:00.000Z',
        subscription: { packageId: 'premium', packageName: 'Premium' },
      },
      {
        status: 'PENDING',
        amount: '50',
        billingPeriodStart: '2026-08-01T00:00:00.000Z',
        dueDate: '2026-08-15T00:00:00.000Z',
        subscription: { packageId: 'basic', packageName: 'Basic' },
      },
      {
        status: 'OVERDUE',
        amount: 30,
        billingPeriodStart: '2026-08-01T00:00:00.000Z',
        dueDate: '2026-07-15T00:00:00.000Z',
        subscription: { packageId: 'basic', packageName: 'Basic' },
      },
      {
        status: 'CANCELLED',
        amount: 20,
        billingPeriodStart: '2026-08-01T00:00:00.000Z',
      },
    ],
    payments: [
      {
        status: 'SUCCESSFUL',
        amount: 100,
        createdAt: '2026-08-05T00:00:00.000Z',
        processedAt: '2026-08-05T01:00:00.000Z',
      },
      {
        status: 'FAILED',
        amount: 30,
        createdAt: '2026-08-06T00:00:00.000Z',
        processedAt: '2026-08-06T01:00:00.000Z',
      },
    ],
    complaints: [
      {
        status: 'PENDING',
        category: 'Connectivity',
        createdAt: '2026-08-05T00:00:00.000Z',
        resolvedAt: null,
      },
      {
        status: 'RESOLVED',
        category: 'Connectivity',
        createdAt: '2026-08-06T00:00:00.000Z',
        resolvedAt: '2026-08-06T02:00:00.000Z',
      },
    ],
    technicians: [{ capacity: 2 }, { capacity: 1 }],
    workOrders: [
      { status: 'IN_PROGRESS', completedAt: null },
      { status: 'COMPLETED', completedAt: '2026-08-07T00:00:00.000Z' },
      { status: 'COMPLETED', completedAt: '2026-07-07T00:00:00.000Z' },
      {
        status: 'CANCELLED',
        completedAt: null,
        updatedAt: '2026-08-08T00:00:00.000Z',
      },
    ],
  };
}

describe('Phase 3G.1 reporting aggregation foundation', () => {
  it('calculates customer, subscription, financial, complaint and technician metrics', () => {
    const report = aggregateReportMetrics(reportingFacts(), august);

    expect(report.customers).toEqual({
      totalCustomers: 2,
      newCustomers: 1,
      statusDistribution: [
        { id: 'active', value: 1 },
        { id: 'suspended', value: 1 },
      ],
    });
    expect(report.subscriptions).toEqual({
      activeSubscriptions: 1,
      activationCount: 1,
      cancellationCount: 1,
      packageDistribution: [{ id: 'premium', value: 1 }],
    });
    expect(report.financial).toEqual({
      grossBilledAmount: { amount: 180, currency: 'PKR' },
      collectedCash: { amount: 100, currency: 'PKR' },
      pendingReceivables: { amount: 50, currency: 'PKR' },
      overdueAmount: { amount: 30, currency: 'PKR' },
      overdueAging: [
        {
          id: '0-30',
          label: '0–30 days',
          minimumDays: 0,
          maximumDays: 30,
          count: 0,
          amount: { amount: 0, currency: 'PKR' },
        },
        {
          id: '31-60',
          label: '31–60 days',
          minimumDays: 31,
          maximumDays: 60,
          count: 1,
          amount: { amount: 30, currency: 'PKR' },
        },
        {
          id: '61-90',
          label: '61–90 days',
          minimumDays: 61,
          maximumDays: 90,
          count: 0,
          amount: { amount: 0, currency: 'PKR' },
        },
        {
          id: '91-plus',
          label: '91+ days',
          minimumDays: 91,
          maximumDays: null,
          count: 0,
          amount: { amount: 0, currency: 'PKR' },
        },
      ],
      revenueByPackage: [
        { id: 'Basic', value: 80 },
        { id: 'Premium', value: 100 },
      ],
      paymentStatusDistribution: [
        { id: 'failed', value: 1 },
        { id: 'successful', value: 1 },
      ],
    });
    expect(report.complaints).toEqual({
      complaintVolume: 2,
      openComplaints: 1,
      statusDistribution: [
        { id: 'pending', value: 1 },
        { id: 'resolved', value: 1 },
      ],
      categoryDistribution: [{ id: 'Connectivity', value: 2 }],
      averageResolutionTimeHours: 2,
    });
    expect(report.technicians).toMatchObject({
      activeWorkload: 1,
      totalCapacity: 3,
      completedWorkOrders: 1,
      cancelledWorkOrders: 1,
    });
    expect(report.technicians.utilizationPercentage).toBeCloseTo(100 / 3);
  });

  it('applies inclusive date filtering without changing current snapshot totals', () => {
    const report = aggregateReportMetrics(reportingFacts(), {
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-09-30T23:59:59.999Z',
    });

    expect(report.customers).toMatchObject({
      totalCustomers: 2,
      newCustomers: 0,
    });
    expect(report.subscriptions).toMatchObject({
      activeSubscriptions: 1,
      activationCount: 0,
      cancellationCount: 0,
    });
    expect(report.financial.grossBilledAmount.amount).toBe(0);
    expect(report.financial.collectedCash.amount).toBe(0);
    expect(report.complaints.openComplaints).toBe(0);
    expect(report.technicians).toMatchObject({
      activeWorkload: 1,
      completedWorkOrders: 0,
    });
  });

  it('returns neutral values for empty reporting data', () => {
    const report = aggregateReportMetrics(
      {
        customers: [],
        subscriptions: [],
        invoices: [],
        payments: [],
        complaints: [],
        technicians: [],
        workOrders: [],
      },
      august,
    );

    expect(report.customers.totalCustomers).toBe(0);
    expect(report.subscriptions.packageDistribution).toEqual([]);
    expect(report.financial.grossBilledAmount).toEqual({
      amount: 0,
      currency: 'PKR',
    });
    expect(report.complaints.averageResolutionTimeHours).toBeNull();
    expect(report.technicians.utilizationPercentage).toBe(0);
  });

  it('uses a deterministic reporting clock for all response metadata', async () => {
    const timestamp = '2026-08-22T10:15:00.000Z';
    const service = createReportsService({
      clock: createFixedReportingClock(timestamp),
      repository: { snapshot: () => mockReportsRepository.snapshot() },
    });

    const report = await service.getFoundationAnalytics({
      from: august.from,
      to: august.to,
      timezone: 'Asia/Karachi',
    });

    expect(report).toMatchObject({
      ...august,
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      generatedAt: timestamp,
      asOf: timestamp,
      source: 'mock',
    });
  });

  it('preserves source repositories when a reporting snapshot is mutated', () => {
    const snapshot = mockReportsRepository.snapshot();
    snapshot.customers[0]!.name = 'Changed in report';
    snapshot.packages[0]!.features[0] = 'Changed feature';
    snapshot.workOrders[0]!.status = 'CANCELLED';

    expect(mockCustomerRepository.list()[0]?.name).not.toBe(
      'Changed in report',
    );
    expect(mockPackageRepository.list()[0]?.features[0]).not.toBe(
      'Changed feature',
    );
    expect(mockTechnicianRepository.snapshot().workOrders[0]?.status).not.toBe(
      'CANCELLED',
    );
  });

  it('keeps the reporting repository read-only and business repositories authoritative', () => {
    expect(Object.keys(mockReportsRepository)).toEqual(['snapshot']);
    const before = mockReportsRepository.snapshot().customers.length;
    const created = mockCustomerRepository.create({
      name: 'Reporting Owner Test',
      phone: '+92 300 000 9999',
      email: null,
      address: null,
      cnic: null,
      connectionId: 'AMX-REPORT-1',
    });

    expect(mockReportsRepository.snapshot().customers.length).toBe(before + 1);
    expect(mockReportsRepository.snapshot().customers.at(-1)?.id).toBe(
      created.id,
    );
    mockCustomerRepository.reset();
  });

  it('keeps customer aggregation pure and does not mutate input facts', () => {
    const customers = reportingFacts().customers;
    const preserved = customers.map(item => ({ ...item }));

    aggregateCustomerMetrics(customers, august);

    expect(customers).toEqual(preserved);
  });
});
