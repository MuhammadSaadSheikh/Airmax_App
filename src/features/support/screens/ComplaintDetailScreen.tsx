import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  SecondaryButton,
  SkeletonCard,
  StatusBadge,
  Surface,
} from '@/components';
import {
  ComplaintTimeline,
  ResolutionCard,
  TechnicianCard,
} from '@/features/support/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { mapTechnicianAssignment } from '@/services/api/technician/technician.mapper';
import { useCustomerProfile } from '@/services/customer';
import {
  useComplaintDetail,
  useComplaintTechnician,
  useWorkOrderTracking,
} from '@/services/support';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ComplaintDetail'>;

export default function ComplaintDetailScreen({ route }: Props) {
  const customerQuery = useCustomerProfile();
  const query = useComplaintDetail(customerQuery.data?.id, route.params.id);
  const trackingEnabled =
    Boolean(query.data) && query.data?.status !== 'submitted';
  const technicianQuery = useComplaintTechnician(
    route.params.id,
    trackingEnabled,
  );
  const workOrderQuery = useWorkOrderTracking(
    query.data?.workOrderId,
    trackingEnabled,
  );

  if (customerQuery.isPending || query.isPending) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <AppHeader title="Complaint detail" showBack />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </AppScreen>
    );
  }
  if (customerQuery.isError || query.isError || !query.data) {
    return (
      <AppScreen>
        <AppHeader title="Complaint detail" showBack />
        <ErrorState
          title="Ticket not found"
          message="This complaint may no longer be available."
          retry={() => {
            void customerQuery.refetch();
            void query.refetch();
          }}
        />
      </AppScreen>
    );
  }

  const complaint = query.data;
  const trackingLoading =
    (trackingEnabled && technicianQuery.isPending) ||
    (Boolean(complaint.workOrderId) && workOrderQuery.isPending);
  const trackingError =
    technicianQuery.isError ||
    (Boolean(complaint.workOrderId) && workOrderQuery.isError);
  const assignment = technicianQuery.data
    ? mapTechnicianAssignment(
        technicianQuery.data,
        workOrderQuery.data,
        complaint.updatedAt,
      )
    : undefined;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader title="Complaint detail" subtitle={complaint.id} showBack />
      <Surface style={styles.summary}>
        <View style={styles.topRow}>
          <AppText style={styles.category}>
            {complaint.category.toUpperCase()} ISSUE
          </AppText>
          <StatusBadge
            label={complaint.status}
            tone={complaint.status === 'resolved' ? 'success' : 'info'}
          />
        </View>
        <AppText style={styles.title}>{complaint.title}</AppText>
        <AppText style={styles.body}>{complaint.description}</AppText>
        <View style={styles.expected}>
          <AppText style={styles.expectedLabel}>EXPECTED RESOLUTION</AppText>
          <AppText style={styles.expectedValue}>
            {complaint.expectedResolution ?? 'Update pending'}
          </AppText>
        </View>
      </Surface>
      <AppText style={styles.sectionTitle}>Ticket timeline</AppText>
      <Surface>
        <ComplaintTimeline items={complaint.timeline} />
      </Surface>
      {trackingLoading ? <SkeletonCard lines={4} /> : null}
      {trackingError ? (
        <ErrorState
          title="Tracking unavailable"
          message="We couldn't refresh the assigned technician or work order."
          retry={() => {
            void technicianQuery.refetch();
            void workOrderQuery.refetch();
          }}
        />
      ) : null}
      {assignment ? (
        <>
          <AppText style={styles.sectionTitle}>Technician status</AppText>
          <TechnicianCard assignment={assignment} />
        </>
      ) : null}
      {complaint.resolution ? (
        <ResolutionCard resolution={complaint.resolution} />
      ) : null}
      <SecondaryButton
        title="CONTACT SUPPORT"
        icon="chatbubble-ellipses-outline"
        onPress={() =>
          Alert.alert(
            'AIRMAX support',
            `A support agent can see ticket ${complaint.id}.`,
          )
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  summary: { gap: spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: { ...typography.small, color: colors.primary },
  title: { ...typography.sectionTitle, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
  expected: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  expectedLabel: { ...typography.small, color: colors.muted },
  expectedValue: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
});
