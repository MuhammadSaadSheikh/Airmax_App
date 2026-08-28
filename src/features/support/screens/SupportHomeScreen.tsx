import { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, AppText, ErrorState, SkeletonCard } from '@/components';
import {
  ComplaintCard,
  DiagnosticCard,
  QuickHelpCard,
  SupportChatButton,
  SupportHeader,
} from '@/features/support/components';
import { useCustomerNavigation } from '@/navigation';
import { useCustomerProfile } from '@/services/customer';
import { useCustomerComplaints } from '@/services/support';
import { colors, spacing, typography } from '@/theme';

export default function SupportHomeScreen() {
  const navigation = useCustomerNavigation();
  const customerQuery = useCustomerProfile();
  const complaintsQuery = useCustomerComplaints(customerQuery.data?.id);
  const activeTickets =
    complaintsQuery.data?.filter(item => item.status !== 'resolved') ?? [];
  const openTicket = useCallback(
    (id: string) => navigation.navigate('ComplaintDetail', { id }),
    [navigation],
  );

  const list = [
    {
      icon: 'sparkles-outline',
      title: 'AI help',
      subtitle: 'Identify an issue',
      onPress: () =>
        navigation.navigate('Diagnostics', { issueType: 'general' }),
    },
    {
      icon: 'ticket-outline',
      title: 'My tickets',
      subtitle: 'Track every update',
      onPress: () => navigation.navigate('ComplaintHistory'),
    },
    {
      icon: 'add-circle-outline',
      title: 'Complaint',
      subtitle: 'Create a new ticket',
      onPress: () => navigation.navigate('CreateComplaint'),
    },
  ] as const;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <SupportHeader />
      <AppText style={styles.sectionTitle}>Quick help</AppText>
      <View style={styles.actions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {list.map(item => (
            <QuickHelpCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={item.onPress}
            />
          ))}
        </ScrollView>
        {/* <QuickHelpCard
          icon="sparkles-outline"
          title="AI help"
          subtitle="Identify an issue"
          onPress={() =>
            navigation.navigate('Diagnostics', { issueType: 'general' })
          }
        /> */}
        {/* <QuickHelpCard
          icon="ticket-outline"
          title="My tickets"
          subtitle="Track every update"
          onPress={() => navigation.navigate('ComplaintHistory')}
        /> */}
        {/* <QuickHelpCard
          icon="add-circle-outline"
          title="Complaint"
          subtitle="Create a new ticket"
          onPress={() => navigation.navigate('CreateComplaint')}
        /> */}
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
      {customerQuery.isPending || complaintsQuery.isPending ? (
        <SkeletonCard lines={4} />
      ) : null}
      {customerQuery.isError || complaintsQuery.isError ? (
        <ErrorState
          title="Tickets unavailable"
          message="We couldn't load your support tickets."
          retry={() => {
            void customerQuery.refetch();
            void complaintsQuery.refetch();
          }}
        />
      ) : null}
      {activeTickets.slice(0, 2).map(complaint => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          onPress={() => openTicket(complaint.id)}
        />
      ))}
      {!customerQuery.isPending &&
      !complaintsQuery.isPending &&
      activeTickets.length === 0 ? (
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
