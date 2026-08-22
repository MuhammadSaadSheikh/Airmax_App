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
  const View = host('View');
  return {
    View,
    Text: host('Text'),
    TextInput: host('TextInput'),
    Pressable: host('Pressable'),
    ScrollView: host('ScrollView'),
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

jest.mock('@/components', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, TextInput, View } =
    jest.requireMock<typeof import('react-native')>('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppHeader: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    AppText: Text,
    SearchField: (props: object) => React.createElement(TextInput, props),
    SkeletonCard: ({ lines }: { lines: number }) =>
      React.createElement(View, { testID: `skeleton-${lines}` }),
    ErrorState: ({ title }: { title: string }) =>
      React.createElement(Text, { testID: 'admin-error' }, title),
  };
});

jest.mock('@/features/admin/components', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, View } =
    jest.requireMock<typeof import('react-native')>('react-native');
  return {
    AuditFilterBar: (props: object) =>
      React.createElement(View, { testID: 'audit-filter', ...props }),
    AuditListItem: ({ event }: { event: { id: string } }) =>
      React.createElement(Text, { testID: `audit-${event.id}` }, event.id),
    AuditSkeleton: () =>
      React.createElement(Text, { testID: 'audit-skeleton' }, 'Loading audit'),
    AuditEmptyState: () =>
      React.createElement(Text, { testID: 'audit-empty' }, 'No audit events'),
  };
});

jest.mock('@/services/api/audit.service', () => ({
  auditService: { getAuditEvents: jest.fn() },
}));
jest.mock('@/services/query', () => ({
  queryKeys: {
    adminAuditList: (filters: object) => ['admin-audit', 'list', filters],
  },
}));

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AdminDetailSkeleton } from '@/features/admin/components/AdminDetailSkeleton';
import { AuditFilterBar } from '@/features/admin/components/audit/AuditFilterBar';
import AdminAuditScreen from '@/features/admin/screens/AdminAuditScreen';
import {
  canDelete,
  createAdminPermissions,
  runProtectedAdminAction,
} from '@/features/admin/security';

const event = {
  id: 'audit-1',
  actorId: 'admin-1',
  actorName: 'Admin One',
  action: 'PACKAGE_DEACTIVATED' as const,
  entityType: 'PACKAGE' as const,
  entityId: 'premium',
  timestamp: '2026-08-22T10:00:00.000Z',
  metadata: {},
};

const result = (data: unknown, overrides: object = {}) => ({
  data,
  isPending: false,
  isError: false,
  isRefetching: false,
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

describe('Phase 3H.3 admin UI polish', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['success', result([event]), 'audit-audit-1'],
    ['loading', result(undefined, { isPending: true }), 'audit-skeleton'],
    ['error', result(undefined, { isError: true }), 'admin-error'],
    ['empty', result([]), 'audit-empty'],
  ])('renders the audit %s state', async (_state, queryResult, testID) => {
    (useQuery as jest.Mock).mockReturnValue(queryResult);
    const screen = await render(<AdminAuditScreen />);
    expect(screen.root.findByProps({ testID })).toBeTruthy();
  });

  it('announces standardized detail loading state', async () => {
    const skeleton = await render(
      <AdminDetailSkeleton label="Loading invoice details" rows={[4, 3]} />,
    );
    const progress = skeleton.root.findByProps({
      accessibilityLabel: 'Loading invoice details',
    });
    expect(progress.props).toMatchObject({
      accessibilityRole: 'progressbar',
      accessibilityLiveRegion: 'polite',
      accessibilityState: { busy: true },
    });
  });

  it('provides explicit labels and selected state for audit filters', async () => {
    const filter = await render(
      <AuditFilterBar
        search=""
        entityType="PACKAGE"
        onSearchChange={jest.fn()}
        onEntityTypeChange={jest.fn()}
        onActionChange={jest.fn()}
      />,
    );
    expect(
      filter.root.findByProps({ accessibilityLabel: 'Search audit events' }),
    ).toBeTruthy();
    const packageChip = filter.root.find(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel ===
          'Filter audit events by entity PACKAGE',
    );
    expect(packageChip.props.accessibilityState).toEqual({ selected: true });
  });

  it('keeps permission guards enforced after UI polishing', () => {
    const permissions = createAdminPermissions({ delete: [] });
    expect(canDelete('packages', permissions)).toBe(false);
    expect(() =>
      runProtectedAdminAction(false, 'delete', 'packages', jest.fn()),
    ).toThrow('Admin permission denied');
  });
});
