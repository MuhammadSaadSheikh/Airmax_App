jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('react-native-css-interop/jsx-runtime', () =>
  jest.requireActual('react/jsx-runtime'),
);
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    View: host('View'),
    Text: host('Text'),
    Pressable: host('Pressable'),
    NativeModules: {},
    Platform: { OS: 'ios' },
    StyleSheet: { create: <T,>(styles: T) => styles },
  };
});

const mockNavigate = jest.fn();
jest.mock('@/navigation', () => ({
  useAdminNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@/services/api/reports.service', () => ({
  reportsService: { getFoundationAnalytics: jest.fn() },
}));
jest.mock('@/services/query', () => ({
  queryKeys: {
    adminReports: ['admin-reports'],
    adminFinancialReport: (filters: object) => [
      'admin-reports',
      'financial',
      filters,
    ],
    adminCustomerReport: (filters: object) => [
      'admin-reports',
      'customer',
      filters,
    ],
    adminComplaintReport: (filters: object) => [
      'admin-reports',
      'complaint',
      filters,
    ],
    adminTechnicianReport: (filters: object) => [
      'admin-reports',
      'technician',
      filters,
    ],
  },
}));
jest.mock('@/components', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, View } =
    jest.requireMock<typeof import('react-native')>('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppHeader: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    EmptyState: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    ErrorState: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
  };
});
jest.mock('@/features/admin/components', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, View } =
    jest.requireMock<typeof import('react-native')>('react-native');
  return {
    ReportFilterBar: (props: object) =>
      React.createElement(View, { testID: 'report-filter', ...props }),
    ReportFilterChips: ({ label }: { label: string }) =>
      React.createElement(Text, null, label),
    ReportExportAction: () => React.createElement(Text, null, 'Export CSV'),
    ReportSkeleton: () => React.createElement(Text, null, 'Loading report'),
    ReportSummaryGrid: ({
      metrics,
    }: {
      metrics: Array<{ id: string; label: string; value: string }>;
    }) =>
      React.createElement(
        View,
        null,
        metrics.map(metric =>
          React.createElement(
            Text,
            { key: metric.id },
            `${metric.label}: ${metric.value}`,
          ),
        ),
      ),
    ReportBreakdownCard: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    ReportTrendCard: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    ReportDataSourceNotice: () =>
      React.createElement(Text, null, 'Reporting snapshot source'),
  };
});

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AdminReportsScreen from '@/features/admin/screens/AdminReportsScreen';
import ComplaintReportScreen from '@/features/admin/screens/ComplaintReportScreen';
import CustomerReportScreen from '@/features/admin/screens/CustomerReportScreen';
import FinancialReportScreen from '@/features/admin/screens/FinancialReportScreen';
import TechnicianReportScreen from '@/features/admin/screens/TechnicianReportScreen';

const report = {
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-31T23:59:59.999Z',
  timezone: 'Asia/Karachi',
  currency: 'PKR' as const,
  generatedAt: '2026-08-22T10:00:00.000Z',
  asOf: '2026-08-22T10:00:00.000Z',
  source: 'mock' as const,
  filterOptions: {
    packages: [{ id: 'premium', label: 'Premium' }],
    customerStatuses: [{ id: 'ACTIVE', label: 'Active' }],
    complaintCategories: [{ id: 'Connectivity', label: 'Connectivity' }],
    technicianAreas: [{ id: 'central', label: 'Karachi Central' }],
  },
  customers: {
    totalCustomers: 12,
    newCustomers: 3,
    statusDistribution: [{ id: 'active', value: 10 }],
  },
  subscriptions: {
    activeSubscriptions: 9,
    activationCount: 2,
    cancellationCount: 1,
    packageDistribution: [],
  },
  financial: {
    grossBilledAmount: { amount: 12000, currency: 'PKR' as const },
    collectedCash: { amount: 8000, currency: 'PKR' as const },
    pendingReceivables: { amount: 2500, currency: 'PKR' as const },
    overdueAmount: { amount: 1500, currency: 'PKR' as const },
    overdueAging: [
      {
        id: '0-30',
        label: '0–30 days',
        minimumDays: 0,
        maximumDays: 30,
        count: 1,
        amount: { amount: 1500, currency: 'PKR' as const },
      },
    ],
    revenueByPackage: [{ id: 'Premium', value: 12000 }],
    paymentStatusDistribution: [{ id: 'successful', value: 4 }],
  },
  complaints: {
    complaintVolume: 5,
    openComplaints: 2,
    statusDistribution: [],
    categoryDistribution: [],
    averageResolutionTimeHours: 4,
  },
  technicians: {
    activeWorkload: 2,
    totalCapacity: 5,
    utilizationPercentage: 40,
    completedWorkOrders: 6,
    cancelledWorkOrders: 1,
  },
};

const result = (data: unknown, overrides: object = {}) => ({
  data,
  isPending: false,
  isError: false,
  refetch: jest.fn(),
  ...overrides,
});
async function render(element: React.ReactElement): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(element);
  });
  return renderer;
}

describe('Phase 3G.2 admin reports screens', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders overview reporting metrics from the reports service response', async () => {
    (useQuery as jest.Mock).mockReturnValue(result(report));
    const screen = await render(<AdminReportsScreen />);
    expect(screen.root.findByProps({ children: 'Customers: 12' })).toBeTruthy();
    expect(
      screen.root.findByProps({ children: 'Collected cash: Rs. 8,000' }),
    ).toBeTruthy();
    expect(
      screen.root.findByProps({ children: 'Technician utilization: 40%' }),
    ).toBeTruthy();
  });

  it('renders the skeleton while the report is loading', async () => {
    (useQuery as jest.Mock).mockReturnValue(
      result(undefined, { isPending: true }),
    );
    const screen = await render(<AdminReportsScreen />);
    expect(
      screen.root.findByProps({ children: 'Loading report' }),
    ).toBeTruthy();
  });

  it('renders an empty state for a neutral snapshot', async () => {
    const empty = {
      ...report,
      customers: { ...report.customers, totalCustomers: 0 },
      subscriptions: { ...report.subscriptions, activeSubscriptions: 0 },
      financial: {
        ...report.financial,
        grossBilledAmount: { amount: 0, currency: 'PKR' as const },
        collectedCash: { amount: 0, currency: 'PKR' as const },
        pendingReceivables: { amount: 0, currency: 'PKR' as const },
        overdueAmount: { amount: 0, currency: 'PKR' as const },
      },
      complaints: { ...report.complaints, complaintVolume: 0 },
      technicians: {
        ...report.technicians,
        activeWorkload: 0,
        completedWorkOrders: 0,
        cancelledWorkOrders: 0,
      },
    };
    (useQuery as jest.Mock).mockReturnValue(result(empty));
    const screen = await render(<AdminReportsScreen />);
    expect(
      screen.root.findByProps({ children: 'No reporting data' }),
    ).toBeTruthy();
  });

  it('renders a retryable error state', async () => {
    (useQuery as jest.Mock).mockReturnValue(
      result(undefined, { isError: true }),
    );
    const screen = await render(<AdminReportsScreen />);
    expect(
      screen.root.findByProps({ children: 'Reports unavailable' }),
    ).toBeTruthy();
  });

  it('changes the scoped query key when the period filter changes', async () => {
    (useQuery as jest.Mock).mockReturnValue(result(report));
    const screen = await render(<AdminReportsScreen />);
    await act(async () => {
      screen.root
        .findByProps({ testID: 'report-filter' })
        .props.onChange('all_time');
    });
    const latest = (useQuery as jest.Mock).mock.calls.at(-1)?.[0];
    expect(latest.queryKey[2]).toMatchObject({
      from: '1970-01-01T00:00:00.000Z',
      timezone: 'Asia/Karachi',
    });
  });

  it('displays financial aging, package and payment report sections', async () => {
    (useQuery as jest.Mock).mockReturnValue(result(report));
    const screen = await render(<FinancialReportScreen />);
    expect(
      screen.root.findByProps({ children: 'Gross billed revenue: Rs. 12,000' }),
    ).toBeTruthy();
    expect(screen.root.findByProps({ children: 'Overdue aging' })).toBeTruthy();
    expect(
      screen.root.findByProps({ children: 'Revenue by package' }),
    ).toBeTruthy();
    expect(
      screen.root.findByProps({ children: 'Payment status distribution' }),
    ).toBeTruthy();
  });

  it('renders customer, complaint and technician report data', async () => {
    (useQuery as jest.Mock).mockReturnValue(result(report));
    const customer = await render(<CustomerReportScreen />);
    expect(
      customer.root.findByProps({ children: 'Total customers: 12' }),
    ).toBeTruthy();

    const complaint = await render(<ComplaintReportScreen />);
    expect(
      complaint.root.findByProps({ children: 'Complaint volume: 5' }),
    ).toBeTruthy();

    const technician = await render(<TechnicianReportScreen />);
    expect(
      technician.root.findByProps({ children: 'Completed jobs: 6' }),
    ).toBeTruthy();
    expect(
      technician.root.findByProps({ children: 'Cancelled jobs: 1' }),
    ).toBeTruthy();
  });
});
