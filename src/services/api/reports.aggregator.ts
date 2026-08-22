import type {
  ComplaintReportMetrics,
  CustomerReportMetrics,
  FinancialReportMetrics,
  AgingBucket,
  MoneyMetric,
  ReportBreakdownItem,
  ReportDateRange,
  ReportMetrics,
  SubscriptionReportMetrics,
  TechnicianReportMetrics,
} from './reports.models';

export type ReportingCustomerFact = {
  role: string;
  status: string;
  createdAt: string;
};

export type ReportingSubscriptionFact = {
  status: string;
  packageId: string;
  history: Array<{ status: string; createdAt: string }>;
};

export type ReportingInvoiceFact = {
  status: string;
  amount: number | string;
  billingPeriodStart: string;
  dueDate?: string;
  subscription?: { packageId: string; packageName?: string };
};

export type ReportingPaymentFact = {
  status: string;
  amount: number | string;
  createdAt: string;
  processedAt: string | null;
};

export type ReportingComplaintFact = {
  status: string;
  category: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type ReportingTechnicianFact = {
  capacity: number;
};

export type ReportingWorkOrderFact = {
  status: string;
  completedAt: string | null;
  updatedAt?: string;
};

export type ReportingSnapshotFacts = {
  customers: ReportingCustomerFact[];
  subscriptions: ReportingSubscriptionFact[];
  invoices: ReportingInvoiceFact[];
  payments: ReportingPaymentFact[];
  complaints: ReportingComplaintFact[];
  technicians: ReportingTechnicianFact[];
  workOrders: ReportingWorkOrderFact[];
};

const activeWorkOrderStatuses = new Set([
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
]);

function numericValue(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function isInRange(value: string | null, range: ReportDateRange): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    timestamp >= Date.parse(range.from) &&
    timestamp <= Date.parse(range.to)
  );
}

function money(amount: number): MoneyMetric {
  return { amount, currency: 'PKR' };
}

function breakdown(values: string[]): ReportBreakdownItem[] {
  const counts = new Map<string, number>();
  values.forEach(value => {
    const id = value.trim() || 'unknown';
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([id, value]) => ({ id, value }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function valueBreakdown(
  values: Array<{ id: string; value: number }>,
): ReportBreakdownItem[] {
  const totals = new Map<string, number>();
  values.forEach(item => {
    const id = item.id.trim() || 'unknown';
    totals.set(id, (totals.get(id) ?? 0) + item.value);
  });
  return [...totals.entries()]
    .map(([id, value]) => ({ id, value }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function overdueAging(
  invoices: ReportingInvoiceFact[],
  asOf: string,
): AgingBucket[] {
  const definitions = [
    { id: '0-30', label: '0–30 days', minimumDays: 0, maximumDays: 30 },
    { id: '31-60', label: '31–60 days', minimumDays: 31, maximumDays: 60 },
    { id: '61-90', label: '61–90 days', minimumDays: 61, maximumDays: 90 },
    { id: '91-plus', label: '91+ days', minimumDays: 91, maximumDays: null },
  ] as const;
  const asOfTimestamp = Date.parse(asOf);

  return definitions.map(definition => {
    const matching = invoices.filter(invoice => {
      if (!invoice.dueDate || invoice.status !== 'OVERDUE') return false;
      const dueTimestamp = Date.parse(invoice.dueDate);
      if (!Number.isFinite(dueTimestamp) || !Number.isFinite(asOfTimestamp)) {
        return false;
      }
      const days = Math.max(
        0,
        Math.floor((asOfTimestamp - dueTimestamp) / 86_400_000),
      );
      return (
        days >= definition.minimumDays &&
        (definition.maximumDays === null || days <= definition.maximumDays)
      );
    });
    return {
      ...definition,
      count: matching.length,
      amount: money(
        matching.reduce(
          (total, invoice) => total + numericValue(invoice.amount),
          0,
        ),
      ),
    };
  });
}

export function aggregateCustomerMetrics(
  customers: ReportingCustomerFact[],
  range: ReportDateRange,
): CustomerReportMetrics {
  const customerRecords = customers.filter(item => item.role === 'CUSTOMER');
  return {
    totalCustomers: customerRecords.length,
    newCustomers: customerRecords.filter(item =>
      isInRange(item.createdAt, range),
    ).length,
    statusDistribution: breakdown(
      customerRecords.map(item => item.status.toLowerCase()),
    ),
  };
}

export function aggregateSubscriptionMetrics(
  subscriptions: ReportingSubscriptionFact[],
  range: ReportDateRange,
): SubscriptionReportMetrics {
  const active = subscriptions.filter(item => item.status === 'ACTIVE');
  const history = subscriptions.flatMap(item => item.history);
  return {
    activeSubscriptions: active.length,
    activationCount: history.filter(
      item => item.status === 'ACTIVE' && isInRange(item.createdAt, range),
    ).length,
    cancellationCount: history.filter(
      item => item.status === 'CANCELLED' && isInRange(item.createdAt, range),
    ).length,
    packageDistribution: breakdown(active.map(item => item.packageId)),
  };
}

export function aggregateFinancialMetrics(
  invoices: ReportingInvoiceFact[],
  payments: ReportingPaymentFact[],
  range: ReportDateRange,
): FinancialReportMetrics {
  const periodInvoices = invoices.filter(item =>
    isInRange(item.billingPeriodStart, range),
  );
  const successfulPayments = payments.filter(
    item =>
      item.status === 'SUCCESSFUL' &&
      isInRange(item.processedAt ?? item.createdAt, range),
  );
  const periodPayments = payments.filter(item =>
    isInRange(item.processedAt ?? item.createdAt, range),
  );
  const billableInvoices = periodInvoices.filter(
    item => item.status !== 'CANCELLED',
  );
  return {
    grossBilledAmount: money(
      billableInvoices.reduce(
        (total, item) => total + numericValue(item.amount),
        0,
      ),
    ),
    collectedCash: money(
      successfulPayments.reduce(
        (total, item) => total + numericValue(item.amount),
        0,
      ),
    ),
    pendingReceivables: money(
      periodInvoices
        .filter(item => item.status === 'PENDING')
        .reduce((total, item) => total + numericValue(item.amount), 0),
    ),
    overdueAmount: money(
      periodInvoices
        .filter(item => item.status === 'OVERDUE')
        .reduce((total, item) => total + numericValue(item.amount), 0),
    ),
    overdueAging: overdueAging(periodInvoices, range.to),
    revenueByPackage: valueBreakdown(
      billableInvoices.map(item => ({
        id:
          item.subscription?.packageName ??
          item.subscription?.packageId ??
          'unknown',
        value: numericValue(item.amount),
      })),
    ),
    paymentStatusDistribution: breakdown(
      periodPayments.map(item => item.status.toLowerCase()),
    ),
  };
}

export function aggregateComplaintMetrics(
  complaints: ReportingComplaintFact[],
  range: ReportDateRange,
): ComplaintReportMetrics {
  const periodComplaints = complaints.filter(item =>
    isInRange(item.createdAt, range),
  );
  const resolutionHours = periodComplaints.flatMap(item => {
    if (!item.resolvedAt) return [];
    const duration = Date.parse(item.resolvedAt) - Date.parse(item.createdAt);
    return Number.isFinite(duration) && duration >= 0
      ? [duration / 3_600_000]
      : [];
  });
  const averageResolutionTimeHours =
    resolutionHours.length === 0
      ? null
      : Math.round(
          (resolutionHours.reduce((total, value) => total + value, 0) /
            resolutionHours.length) *
            100,
        ) / 100;
  return {
    complaintVolume: periodComplaints.length,
    openComplaints: periodComplaints.filter(
      item => item.status !== 'RESOLVED' && item.status !== 'CLOSED',
    ).length,
    statusDistribution: breakdown(
      periodComplaints.map(item => item.status.toLowerCase()),
    ),
    categoryDistribution: breakdown(
      periodComplaints.map(item => item.category),
    ),
    averageResolutionTimeHours,
  };
}

export function aggregateTechnicianMetrics(
  technicians: ReportingTechnicianFact[],
  workOrders: ReportingWorkOrderFact[],
  range: ReportDateRange,
): TechnicianReportMetrics {
  const activeWorkload = workOrders.filter(item =>
    activeWorkOrderStatuses.has(item.status),
  ).length;
  const totalCapacity = technicians.reduce(
    (total, item) => total + Math.max(0, item.capacity),
    0,
  );
  return {
    activeWorkload,
    totalCapacity,
    utilizationPercentage:
      totalCapacity === 0
        ? 0
        : Math.min(100, (activeWorkload / totalCapacity) * 100),
    completedWorkOrders: workOrders.filter(
      item => item.status === 'COMPLETED' && isInRange(item.completedAt, range),
    ).length,
    cancelledWorkOrders: workOrders.filter(
      item =>
        item.status === 'CANCELLED' && isInRange(item.updatedAt ?? null, range),
    ).length,
  };
}

export function aggregateReportMetrics(
  snapshot: ReportingSnapshotFacts,
  range: ReportDateRange,
): ReportMetrics {
  return {
    customers: aggregateCustomerMetrics(snapshot.customers, range),
    subscriptions: aggregateSubscriptionMetrics(snapshot.subscriptions, range),
    financial: aggregateFinancialMetrics(
      snapshot.invoices,
      snapshot.payments,
      range,
    ),
    complaints: aggregateComplaintMetrics(snapshot.complaints, range),
    technicians: aggregateTechnicianMetrics(
      snapshot.technicians,
      snapshot.workOrders,
      range,
    ),
  };
}
