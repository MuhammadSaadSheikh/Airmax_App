import type {
  AgingBucket,
  MoneyMetric,
  ReportBreakdownItem,
  ReportsFoundationAnalytics,
} from './reports.models';

export type ReportExportType =
  'overview' | 'financial' | 'customer' | 'complaint' | 'technician';

export type ReportExportRow = {
  section: string;
  metric: string;
  value: string | number;
  currency?: string;
};

export type PreparedReportExport = {
  fileName: string;
  mimeType: 'text/csv';
  content: string;
  generatedAt: string;
  rowCount: number;
};

function moneyRow(
  section: string,
  metric: string,
  value: MoneyMetric,
): ReportExportRow {
  return { section, metric, value: value.amount, currency: value.currency };
}

function breakdownRows(
  section: string,
  metric: string,
  items: ReportBreakdownItem[],
): ReportExportRow[] {
  return items.map(item => ({
    section,
    metric: `${metric}:${item.id}`,
    value: item.value,
  }));
}

function agingRows(items: AgingBucket[]): ReportExportRow[] {
  return items.flatMap(item => [
    {
      section: 'financial',
      metric: `overdue-aging:${item.label}:count`,
      value: item.count,
    },
    {
      section: 'financial',
      metric: `overdue-aging:${item.label}:amount`,
      value: item.amount.amount,
      currency: item.amount.currency,
    },
  ]);
}

export function serializeReportRows(
  type: ReportExportType,
  report: ReportsFoundationAnalytics,
): ReportExportRow[] {
  const metadata: ReportExportRow[] = [
    { section: 'metadata', metric: 'from', value: report.from },
    { section: 'metadata', metric: 'to', value: report.to },
    { section: 'metadata', metric: 'timezone', value: report.timezone },
    { section: 'metadata', metric: 'generated-at', value: report.generatedAt },
    { section: 'metadata', metric: 'source', value: report.source },
  ];
  const customerRows: ReportExportRow[] = [
    {
      section: 'customer',
      metric: 'total-customers',
      value: report.customers.totalCustomers,
    },
    {
      section: 'customer',
      metric: 'new-customers',
      value: report.customers.newCustomers,
    },
    ...breakdownRows('customer', 'status', report.customers.statusDistribution),
  ];
  const subscriptionRows: ReportExportRow[] = [
    {
      section: 'subscription',
      metric: 'active-subscriptions',
      value: report.subscriptions.activeSubscriptions,
    },
    ...breakdownRows(
      'subscription',
      'package',
      report.subscriptions.packageDistribution,
    ),
  ];
  const financialRows: ReportExportRow[] = [
    moneyRow('financial', 'gross-billed', report.financial.grossBilledAmount),
    moneyRow('financial', 'collected-cash', report.financial.collectedCash),
    moneyRow(
      'financial',
      'pending-receivables',
      report.financial.pendingReceivables,
    ),
    moneyRow('financial', 'overdue-amount', report.financial.overdueAmount),
    ...agingRows(report.financial.overdueAging),
    ...breakdownRows(
      'financial',
      'revenue-by-package',
      report.financial.revenueByPackage,
    ),
    ...breakdownRows(
      'financial',
      'payment-status',
      report.financial.paymentStatusDistribution,
    ),
  ];
  const complaintRows: ReportExportRow[] = [
    {
      section: 'complaint',
      metric: 'volume',
      value: report.complaints.complaintVolume,
    },
    {
      section: 'complaint',
      metric: 'open',
      value: report.complaints.openComplaints,
    },
    {
      section: 'complaint',
      metric: 'average-resolution-hours',
      value: report.complaints.averageResolutionTimeHours ?? '',
    },
    ...breakdownRows(
      'complaint',
      'status',
      report.complaints.statusDistribution,
    ),
    ...breakdownRows(
      'complaint',
      'category',
      report.complaints.categoryDistribution,
    ),
  ];
  const technicianRows: ReportExportRow[] = [
    {
      section: 'technician',
      metric: 'active-workload',
      value: report.technicians.activeWorkload,
    },
    {
      section: 'technician',
      metric: 'total-capacity',
      value: report.technicians.totalCapacity,
    },
    {
      section: 'technician',
      metric: 'utilization-percentage',
      value: report.technicians.utilizationPercentage,
    },
    {
      section: 'technician',
      metric: 'completed-work-orders',
      value: report.technicians.completedWorkOrders,
    },
    {
      section: 'technician',
      metric: 'cancelled-work-orders',
      value: report.technicians.cancelledWorkOrders,
    },
  ];

  const selected = {
    overview: [
      ...customerRows,
      ...subscriptionRows,
      ...financialRows,
      ...complaintRows,
      ...technicianRows,
    ],
    financial: financialRows,
    customer: customerRows,
    complaint: complaintRows,
    technician: technicianRows,
  }[type];
  return [...metadata, ...selected];
}

function escapeCsv(value: string | number | undefined): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeReportCsv(rows: ReportExportRow[]): string {
  return [
    'section,metric,value,currency',
    ...rows.map(row =>
      [row.section, row.metric, row.value, row.currency]
        .map(escapeCsv)
        .join(','),
    ),
  ].join('\r\n');
}

export function prepareReportCsvExport(
  type: ReportExportType,
  report: ReportsFoundationAnalytics,
): PreparedReportExport {
  const rows = serializeReportRows(type, report);
  return {
    fileName: `airmax-${type}-report-${report.from.slice(0, 10)}-${report.to.slice(0, 10)}.csv`,
    mimeType: 'text/csv',
    content: serializeReportCsv(rows),
    generatedAt: report.generatedAt,
    rowCount: rows.length,
  };
}
