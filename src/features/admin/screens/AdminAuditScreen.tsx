import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, ErrorState } from '@/components';
import {
  AuditEmptyState,
  AuditFilterBar,
  AuditListItem,
  AuditSkeleton,
} from '@/features/admin/components';
import { auditService } from '@/services/api/audit.service';
import type {
  AdminAuditEvent,
  AuditAction,
  AuditEntityType,
  AuditFilters,
} from '@/services/api/audit.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

export default function AdminAuditScreen() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<AuditEntityType>();
  const [action, setAction] = useState<AuditAction>();
  const filters = useMemo<AuditFilters>(
    () => ({ search: search.trim() || undefined, entityType, action }),
    [action, entityType, search],
  );
  const query = useQuery({
    queryKey: queryKeys.adminAuditList(filters),
    queryFn: () => auditService.getAuditEvents(filters),
  });
  const renderEvent = useCallback(
    ({ item }: { item: AdminAuditEvent }) => <AuditListItem event={item} />,
    [],
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Admin audit trail"
        subtitle="Append-only administrative activity"
        showBack
      />
      <AuditFilterBar
        search={search}
        entityType={entityType}
        action={action}
        onSearchChange={setSearch}
        onEntityTypeChange={setEntityType}
        onActionChange={setAction}
      />
      {query.isPending ? (
        <AuditSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Audit trail unavailable"
          message="Administrative activity could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : (
        <FlatList
          style={styles.list}
          data={query.data}
          keyExtractor={item => item.id}
          renderItem={renderEvent}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={<AuditEmptyState />}
          contentContainerStyle={[
            styles.content,
            query.data.length === 0 && styles.empty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          initialNumToRender={12}
          windowSize={7}
        />
      )}
    </AppScreen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flex: 1 },
  content: { paddingBottom: spacing.huge },
  empty: { flexGrow: 1 },
  separator: { height: spacing.md },
});
