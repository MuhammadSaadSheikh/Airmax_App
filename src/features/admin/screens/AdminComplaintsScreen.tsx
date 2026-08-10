import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, EmptyState, ErrorState } from '@/components';
import { environment } from '@/config/environment';
import {
  ComplaintFilterBar,
  ComplaintListItem,
  ComplaintListSkeleton,
  ComplaintMockNotice,
  ComplaintSummaryGrid,
} from '@/features/admin/components';
import { useAdminNavigation } from '@/navigation';
import { complaintsService } from '@/services/api';
import type {
  AdminComplaint,
  ComplaintStatusFilter,
} from '@/services/api/complaints.models';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

const emptyComplaints: AdminComplaint[] = [];

export default function AdminComplaintsScreen() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ComplaintStatusFilter>('all');
  const complaintsQuery = useQuery({
    queryKey: queryKeys.adminComplaintList,
    queryFn: complaintsService.list,
  });

  const complaints = complaintsQuery.data ?? emptyComplaints;
  const filteredComplaints = useMemo(() => {
    const term = search.trim().toLowerCase();
    return complaints.filter(complaint => {
      const matchesStatus = status === 'all' || complaint.status === status;
      const searchable = [
        complaint.ticketNumber.toString(),
        complaint.customer.name,
        complaint.customer.connectionId ?? '',
        complaint.category,
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && searchable.includes(term);
    });
  }, [complaints, search, status]);

  const renderComplaint = ({ item }: { item: AdminComplaint }) => (
    <ComplaintListItem
      complaint={item}
      onPress={() => navigation.navigate('ComplaintDetail', { id: item.id })}
    />
  );

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Complaint operations"
        subtitle="Assign, progress and close customer tickets"
      />
      {environment.useMockApi ? (
        <View style={styles.notice}>
          <ComplaintMockNotice />
        </View>
      ) : null}

      {complaintsQuery.isPending ? (
        <ComplaintListSkeleton />
      ) : complaintsQuery.isError ? (
        <ErrorState
          title="Complaints unavailable"
          message="We couldn’t load complaint operations data."
          retry={() => void complaintsQuery.refetch()}
        />
      ) : (
        <>
          <ComplaintSummaryGrid complaints={complaints} />
          <ComplaintFilterBar
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
          <FlatList
            style={styles.list}
            data={filteredComplaints}
            keyExtractor={item => item.id}
            renderItem={renderComplaint}
            ItemSeparatorComponent={ListSeparator}
            ListEmptyComponent={
              <EmptyState
                title="No complaints found"
                message="Try a different search or status filter."
                icon="chatbox-ellipses-outline"
              />
            }
            contentContainerStyle={[
              styles.content,
              filteredComplaints.length === 0 && styles.empty,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshing={complaintsQuery.isRefetching}
            onRefresh={() => void complaintsQuery.refetch()}
            initialNumToRender={10}
            windowSize={7}
          />
        </>
      )}
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
