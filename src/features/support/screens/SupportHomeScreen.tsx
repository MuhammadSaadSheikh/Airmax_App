import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppScreen, AppText, ErrorState, SkeletonCard } from '@/components';
import {
  ComplaintCard,
  DiagnosticCard,
  QuickHelpCard,
  SupportChatButton,
  SupportHeader,
} from '@/features/support/components';
import { useCustomerNavigation } from '@/navigation';
import { queryKeys } from '@/services/query';
import { supportService } from '@/services/support';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing, typography } from '@/theme';

export default function SupportHomeScreen() {
  const navigation = useCustomerNavigation();
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const complaintsQuery = useQuery({
    queryKey: queryKeys.supportComplaints(connectionId),
    queryFn: () => supportService.getComplaints(connectionId),
    staleTime: 30_000,
  });
  const activeTickets =
    complaintsQuery.data?.filter(item => item.status !== 'resolved') ?? [];
  const openTicket = useCallback(
    (id: string) => navigation.navigate('ComplaintDetail', { id }),
    [navigation],
  );

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <SupportHeader />
      <AppText style={styles.sectionTitle}>Quick help</AppText>
      <View style={styles.actions}>
        <QuickHelpCard
          icon="sparkles-outline"
          title="AI help"
          subtitle="Identify an issue"
          onPress={() =>
            navigation.navigate('Diagnostics', { issueType: 'general' })
          }
        />
        <QuickHelpCard
          icon="ticket-outline"
          title="My tickets"
          subtitle="Track every update"
          onPress={() => navigation.navigate('ComplaintHistory')}
        />
        <QuickHelpCard
          icon="add-circle-outline"
          title="Complaint"
          subtitle="Create a new ticket"
          onPress={() => navigation.navigate('CreateComplaint')}
        />
      </View>
      <DiagnosticCard onPress={() => navigation.navigate('Diagnostics')} />
      <View style={styles.sectionRow}>
        <AppText style={styles.sectionTitle}>Active tickets</AppText>
        <AppText
          accessibilityRole="button"
          onPress={() => navigation.navigate('ComplaintHistory')}
          style={styles.link}
        >
          View all
        </AppText>
      </View>
      {complaintsQuery.isPending ? <SkeletonCard lines={4} /> : null}
      {complaintsQuery.isError ? (
        <ErrorState
          title="Tickets unavailable"
          message="We couldn't load your support tickets."
          retry={() => void complaintsQuery.refetch()}
        />
      ) : null}
      {activeTickets.slice(0, 2).map(complaint => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          onPress={() => openTicket(complaint.id)}
        />
      ))}
      {!complaintsQuery.isPending && activeTickets.length === 0 ? (
        <AppText style={styles.empty}>
          You have no active support tickets.
        </AppText>
      ) : null}
      <SupportChatButton
        onPress={() =>
          Alert.alert(
            'AIRMAX support',
            'Live support integration is ready for the support API.',
          )
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    ...typography.label,
    color: colors.primary,
    paddingVertical: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
