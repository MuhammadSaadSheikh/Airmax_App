import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import { environment } from '@/config/environment';
import {
  TechnicianFilterBar,
  TechnicianListItem,
  TechnicianListSkeleton,
  TechnicianMockNotice,
  TechnicianSummaryGrid,
  type TechnicianAreaFilter,
  type TechnicianStatusFilter,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { techniciansService } from '@/services/api';
import type {
  AdminTechnician,
  TechnicianArea,
} from '@/services/api/technicians.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

const emptyTechnicians: AdminTechnician[] = [];

export default function AdminTechniciansScreen() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TechnicianStatusFilter>('ALL');
  const [area, setArea] = useState<TechnicianAreaFilter>('ALL');
  const techniciansQuery = useQuery({
    queryKey: queryKeys.adminTechnicianList,
    queryFn: () => techniciansService.getTechnicians(),
  });
  const technicians = techniciansQuery.data ?? emptyTechnicians;

  const areas = useMemo<TechnicianArea[]>(
    () =>
      Array.from(
        new Map(technicians.map(item => [item.area.id, item.area])).values(),
      ),
    [technicians],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return technicians.filter(item => {
      const searchable = [
        item.name,
        item.phone,
        item.area.name,
        ...item.skills.map(skill => skill.name),
      ]
        .join(' ')
        .toLowerCase();
      return (
        searchable.includes(term) &&
        (status === 'ALL' || item.status === status) &&
        (area === 'ALL' || item.area.id === area)
      );
    });
  }, [area, search, status, technicians]);

  const renderTechnician = useCallback(
    ({ item }: { item: AdminTechnician }) => (
      <TechnicianListItem
        technician={item}
        onPress={() => navigation.navigate('TechnicianDetail', { id: item.id })}
      />
    ),
    [navigation],
  );

  if (techniciansQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader
          title="Technician operations"
          subtitle="Field team and work orders"
        />
        <TechnicianListSkeleton />
      </AppScreen>
    );
  }
  if (techniciansQuery.isError) {
    return (
      <AppScreen>
        <AppHeader
          title="Technician operations"
          subtitle="Field team and work orders"
        />
        <ErrorState
          title="Technicians unavailable"
          message="We couldn’t load field service data."
          retry={() => void techniciansQuery.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Technician operations"
        subtitle="Field team and work orders"
      />
      {environment.useMockApi ? (
        <View style={styles.notice}>
          <TechnicianMockNotice />
        </View>
      ) : null}
      <TechnicianSummaryGrid technicians={technicians} />
      <TechnicianFilterBar
        search={search}
        status={status}
        area={area}
        areas={areas}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onAreaChange={setArea}
      />
      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderTechnician}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <EmptyState
            title="No technicians found"
            message="Try a different search, status or area filter."
            icon="construct-outline"
          />
        }
        contentContainerStyle={[
          styles.content,
          filtered.length === 0 && styles.empty,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={techniciansQuery.isRefetching}
        onRefresh={() => void techniciansQuery.refetch()}
        initialNumToRender={10}
        windowSize={7}
      />
    </AppScreen>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notice: { marginBottom: spacing.lg },
  list: { flex: 1 },
  content: { paddingBottom: spacing.huge },
  empty: { flexGrow: 1 },
  separator: { height: spacing.md },
});
