jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(() => Promise.resolve(null)) },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('react-native-css-interop/jsx-runtime', () =>
  jest.requireActual('react/jsx-runtime'),
);

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  const View = host('View');
  return {
    View,
    Text: host('Text'),
    Pressable: host('Pressable'),
    NativeModules: {},
    Platform: { OS: 'ios' },
    StyleSheet: { create: <T,>(styles: T) => styles },
    FlatList: ({
      data,
      renderItem,
      keyExtractor,
      ListEmptyComponent,
      ...props
    }: {
      data: unknown[];
      renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
      keyExtractor: (item: unknown) => string;
      ListEmptyComponent?: React.ReactNode;
    }) =>
      React.createElement(
        View,
        props,
        data.length === 0
          ? ListEmptyComponent
          : data.map((item, index) =>
              React.createElement(
                React.Fragment,
                { key: keyExtractor(item) },
                renderItem({ item, index }),
              ),
            ),
      ),
  };
});

const mockNavigate = jest.fn();
jest.mock('@/navigation', () => ({
  useAdminNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@/services/query', () => ({
  queryKeys: {
    adminInvoiceList: ['admin-billing', 'invoices'],
    adminBillingSummary: ['admin-billing', 'summary'],
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
  const { Pressable, Text, View } =
    jest.requireMock<typeof import('react-native')>('react-native');
  return {
    BillingFilterBar: (props: object) =>
      React.createElement(View, { testID: 'billing-filter', ...props }),
    BillingMockNotice: () => React.createElement(Text, null, 'Mock billing'),
    BillingSummaryGrid: () =>
      React.createElement(Text, null, 'Billing summary'),
    InvoiceListItem: ({
      invoice,
      onPress,
    }: {
      invoice: { id: string; invoiceNumber: string };
      onPress: () => void;
    }) =>
      React.createElement(
        Pressable,
        { testID: `invoice-${invoice.id}`, onPress },
        React.createElement(Text, null, invoice.invoiceNumber),
      ),
    InvoiceListSkeleton: () =>
      React.createElement(Text, null, 'Loading billing invoices'),
  };
});

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { getBillingActionVisibility } from '@/features/admin/components/billing/BillingActionPanel';
import AdminBillingScreen, {
  filterAdminInvoices,
} from '@/features/admin/screens/AdminBillingScreen';
import type {
  AdminBillingSummary,
  AdminInvoice,
} from '@/services/api/billing.models';

const summary: AdminBillingSummary = {
  totalRevenue: 16500,
  collectedPayments: 5000,
  pendingPayments: 7000,
  overdueAmount: 4500,
};

const baseInvoice: AdminInvoice = {
  id: 'invoice-1',
  invoiceNumber: 'AMX-INV-001',
  customer: {
    id: 'u1',
    name: 'Ahmed Khan',
    phone: '+92 300 1234567',
    email: 'ahmed@example.com',
    connectionId: 'AMX-1042',
  },
  subscription: {
    id: 'sub-u1',
    packageId: 'premium',
    packageName: 'Premium',
    packageSpeedMbps: 100,
    packagePrice: 3500,
  },
  billingPeriodStart: '2026-08-01T00:00:00.000Z',
  billingPeriodEnd: '2026-08-31T23:59:59.000Z',
  amount: 7000,
  currency: 'PKR',
  status: 'pending',
  dueDate: '2026-08-25T23:59:59.000Z',
  payments: [],
  timeline: [],
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:01:00.000Z',
  paidAt: null,
  cancelledAt: null,
};

const overdueInvoice: AdminInvoice = {
  ...baseInvoice,
  id: 'invoice-2',
  invoiceNumber: 'AMX-INV-002',
  status: 'overdue',
  customer: { ...baseInvoice.customer, id: 'u2', name: 'Sara Ali' },
  payments: [
    {
      id: 'payment-1',
      invoiceId: 'invoice-2',
      invoiceNumber: 'AMX-INV-002',
      customer: { ...baseInvoice.customer, id: 'u2', name: 'Sara Ali' },
      amount: 4500,
      currency: 'PKR',
      method: 'card',
      status: 'failed',
      reference: 'AMX-PAY-001',
      failureReason: 'Declined',
      createdAt: '2026-08-04T10:00:00.000Z',
      processedAt: '2026-08-04T10:01:00.000Z',
    },
  ],
};

const queryResult = (data: unknown, overrides: object = {}) => ({
  data,
  isPending: false,
  isError: false,
  isRefetching: false,
  refetch: jest.fn(() => Promise.resolve()),
  ...overrides,
});

function setQueries(invoiceResult: object, summaryResult: object) {
  (useQuery as jest.Mock)
    .mockReturnValueOnce(invoiceResult)
    .mockReturnValueOnce(summaryResult);
}

async function renderScreen(): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<AdminBillingScreen />);
  });
  return renderer;
}

describe('Phase 3D admin billing screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the billing invoice list and opens invoice detail', async () => {
    setQueries(
      queryResult([baseInvoice, overdueInvoice]),
      queryResult(summary),
    );
    const renderer = await renderScreen();

    expect(
      renderer.root.findByProps({ testID: 'invoice-invoice-1' }),
    ).toBeTruthy();
    await act(async () => {
      renderer.root
        .findByProps({ testID: 'invoice-invoice-1' })
        .props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('InvoiceDetail', {
      id: 'invoice-1',
    });
  });

  it('filters invoices by search, invoice status and payment status', () => {
    expect(
      filterAdminInvoices(
        [baseInvoice, overdueInvoice],
        'Sara',
        'overdue',
        'failed',
      ),
    ).toEqual([overdueInvoice]);
    expect(
      filterAdminInvoices(
        [baseInvoice, overdueInvoice],
        '',
        'all',
        'no_payment',
      ),
    ).toEqual([baseInvoice]);
  });

  it('renders loading state while invoices are pending', async () => {
    setQueries(
      queryResult(undefined, { isPending: true }),
      queryResult(summary),
    );
    const renderer = await renderScreen();

    expect(
      renderer.root.findByProps({ children: 'Loading billing invoices' }),
    ).toBeTruthy();
  });

  it('renders retryable error state when billing fails', async () => {
    setQueries(queryResult(undefined, { isError: true }), queryResult(summary));
    const renderer = await renderScreen();

    expect(
      renderer.root.findByProps({ children: 'Billing unavailable' }),
    ).toBeTruthy();
  });

  it('keeps lifecycle actions status and permission aware', () => {
    expect(getBillingActionVisibility('pending', true, true)).toEqual({
      recordPayment: true,
      markPaid: true,
      cancel: true,
      readOnly: false,
    });
    expect(getBillingActionVisibility('paid', true, true)).toEqual({
      recordPayment: false,
      markPaid: false,
      cancel: false,
      readOnly: true,
    });
    expect(getBillingActionVisibility('overdue', false, false)).toEqual({
      recordPayment: false,
      markPaid: false,
      cancel: false,
      readOnly: false,
    });
  });
});
