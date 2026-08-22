import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  EmptyState,
  ErrorState,
  Row,
  StatusBadge,
  Surface,
} from '@/components';
import { AdminDetailSkeleton } from '@/features/admin/components';
import { techniciansService } from '@/services/api';
import type { TechnicianArea } from '@/services/api/technicians.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

type AreaSummary = TechnicianArea & { technicianCount: number };

export default function ServiceAreasScreen() {
  const techniciansQuery = useQuery({
    queryKey: queryKeys.adminTechnicianList,
    queryFn: () => techniciansService.getTechnicians(),
  });
  const areas = useMemo<AreaSummary[]>(() => {
    const summaries = new Map<string, AreaSummary>();
    techniciansQuery.data?.forEach(technician => {
      const existing = summaries.get(technician.area.id);
      summaries.set(technician.area.id, {
        ...technician.area,
        technicianCount: (existing?.technicianCount ?? 0) + 1,
      });
    });
    return [...summaries.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [techniciansQuery.data]);
  const renderArea = useCallback(
    ({ item }: { item: AreaSummary }) => (
      <Surface>
        <Row
          icon="location-outline"
          title={item.name}
          subtitle={`${item.city} · ${item.technicianCount} technician${item.technicianCount === 1 ? '' : 's'}`}
          right={<StatusBadge label="Covered" tone="success" />}
        />
      </Surface>
    ),
    [],
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Service areas"
        subtitle="Coverage derived from Field Service technicians"
        showBack
      />
      {techniciansQuery.isPending ? (
        <AdminDetailSkeleton label="Loading service areas" rows={[3, 3, 3]} />
      ) : techniciansQuery.isError ? (
        <ErrorState
          title="Service areas unavailable"
          message="Field Service coverage could not be loaded."
          retry={() => void techniciansQuery.refetch()}
        />
      ) : (
        <FlatList
          data={areas}
          keyExtractor={item => item.id}
          renderItem={renderArea}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={
            <EmptyState
              title="No service areas"
              message="Assign an area to a technician to establish coverage."
              icon="location-outline"
            />
          }
          contentContainerStyle={[
            styles.list,
            areas.length === 0 && styles.emptyList,
          ]}
          refreshing={techniciansQuery.isRefetching}
          onRefresh={() => void techniciansQuery.refetch()}
          initialNumToRender={8}
          windowSize={5}
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
  list: { paddingBottom: spacing.huge },
  emptyList: { flexGrow: 1 },
  separator: { height: spacing.md },
});
