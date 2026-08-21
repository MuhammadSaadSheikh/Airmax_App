import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { environment } from '@/config/environment';
import {
  ComplaintActionPanel,
  ComplaintAssignmentCard,
  ComplaintCustomerCard,
  ComplaintDescriptionCard,
  ComplaintMockNotice,
  ComplaintProfileHeader,
  ComplaintReplyForm,
  ComplaintTimeline,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { complaintsService } from '@/services/api';
import type { AdminComplaintStatus } from '@/services/api/complaints.models';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'ComplaintDetail'>;

export default function ComplaintDetailScreen({ route }: Props) {
  const queryClient = useQueryClient();
  const complaintId = route.params.id;
  const complaintQuery = useQuery({
    queryKey: queryKeys.adminComplaintDetail(complaintId),
    queryFn: () => complaintsService.getById(complaintId),
  });
  const techniciansQuery = useQuery({
    queryKey: queryKeys.adminComplaintTechnicians,
    queryFn: complaintsService.listTechnicians,
  });

  const synchronizeComplaint = () =>
    invalidateAdminMutation(queryClient, 'complaint');

  const assignMutation = useMutation({
    mutationFn: (technicianId: string) =>
      complaintsService.assignTechnician({ complaintId, technicianId }),
    onSuccess: synchronizeComplaint,
  });
  const statusMutation = useMutation({
    mutationFn: (status: AdminComplaintStatus) =>
      complaintsService.updateStatus({ complaintId, status }),
    onSuccess: synchronizeComplaint,
  });
  const replyMutation = useMutation({
    mutationFn: (reply: string) =>
      complaintsService.reply({ complaintId, reply }),
    onSuccess: synchronizeComplaint,
  });

  const confirmAssignment = (technicianId: string) => {
    const technician = techniciansQuery.data?.find(
      item => item.id === technicianId,
    );
    if (!technician || technician.id === complaintQuery.data?.technician?.id)
      return;
    Alert.alert(
      complaintQuery.data?.technician
        ? 'Reassign technician'
        : 'Assign technician',
      `Assign ${technician.name} to this complaint?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', onPress: () => assignMutation.mutate(technicianId) },
      ],
    );
  };

  const confirmStatus = (status: AdminComplaintStatus) => {
    const label = status.replaceAll('_', ' ');
    Alert.alert('Update complaint status', `Move this complaint to ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: status === 'closed' ? 'Close' : 'Update',
        style: status === 'closed' ? 'destructive' : 'default',
        onPress: () => statusMutation.mutate(status),
      },
    ]);
  };

  if (complaintQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Complaint details" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </View>
      </AppScreen>
    );
  }

  if (complaintQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Complaint details" showBack />
        <ErrorState
          title="Complaint unavailable"
          message="This complaint record could not be loaded."
          retry={() => void complaintQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const complaint = complaintQuery.data;
  const mutationError =
    assignMutation.error ?? statusMutation.error ?? replyMutation.error;
  const actionLoading =
    assignMutation.isPending ||
    statusMutation.isPending ||
    replyMutation.isPending;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title={`Ticket #${complaint.ticketNumber}`}
        subtitle="Complaint details"
        showBack
      />
      {environment.useMockApi ? <ComplaintMockNotice /> : null}
      <View style={styles.topCard}>
        <ComplaintProfileHeader complaint={complaint} />
      </View>

      <SectionTitle title="Complaint" />
      <ComplaintDescriptionCard complaint={complaint} />

      <SectionTitle title="Customer" />
      <ComplaintCustomerCard customer={complaint.customer} />

      <SectionTitle title="Technician assignment" />
      {techniciansQuery.isError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          Technician options could not be loaded.
        </AppText>
      ) : (
        <ComplaintAssignmentCard
          complaint={complaint}
          technicians={techniciansQuery.data ?? []}
          loading={techniciansQuery.isPending || actionLoading}
          onAssign={confirmAssignment}
        />
      )}

      <SectionTitle title="Admin reply" />
      <ComplaintReplyForm
        key={complaint.adminReply ?? 'empty-reply'}
        currentReply={complaint.adminReply}
        disabled={complaint.status === 'closed'}
        loading={replyMutation.isPending}
        onSubmit={reply => replyMutation.mutate(reply)}
      />

      <SectionTitle title="Workflow action" />
      <ComplaintActionPanel
        status={complaint.status}
        loading={statusMutation.isPending}
        onStatusChange={confirmStatus}
      />

      {mutationError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {mutationError instanceof Error
            ? mutationError.message
            : 'The complaint action could not be completed.'}
        </AppText>
      ) : null}

      <SectionTitle title="Activity timeline" />
      <ComplaintTimeline events={complaint.events} />
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  loading: { gap: spacing.lg },
  topCard: { marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
