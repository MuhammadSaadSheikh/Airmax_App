import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, AppText, ErrorState } from '@/components';
import { environment } from '@/config/environment';
import {
  AdminDetailSkeleton,
  ComplaintActionPanel,
  ComplaintAssignmentCard,
  ComplaintCustomerCard,
  ComplaintDescriptionCard,
  ComplaintMockNotice,
  ComplaintProfileHeader,
  ComplaintReplyForm,
  ComplaintTimeline,
} from '@/features/admin/components';
import {
  adminAuditEvents,
  adminActionPermissions,
  createAdminConfirmation,
  runProtectedAdminAction,
} from '@/features/admin/security';
import { useAdminAudit } from '@/features/admin/security/useAdminAudit';
import type { AdminStackParamList } from '@/navigation';
import { complaintsService, techniciansService } from '@/services/api';
import type { AdminComplaintStatus } from '@/services/api/complaints.models';
import {
  invalidateAdminMutation,
  invalidateTechnicianAssignment,
  invalidateTechnicianWorkOrder,
  queryKeys,
} from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'ComplaintDetail'>;

export default function ComplaintDetailScreen({ route }: Props) {
  const queryClient = useQueryClient();
  const recordAudit = useAdminAudit();
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
    mutationFn: (technicianId: string) => {
      const reassigning = Boolean(complaintQuery.data?.technician);
      return runProtectedAdminAction(
        reassigning
          ? adminActionPermissions.reassignComplaint()
          : adminActionPermissions.assignComplaint(),
        reassigning ? 'reassign complaint' : 'assign complaint',
        'complaints',
        () =>
          reassigning
            ? techniciansService.reassignComplaint({
                complaintId,
                technicianId,
              })
            : techniciansService.assignComplaint({
                complaintId,
                technicianId,
              }),
      );
    },
    onSuccess: async (assignment, technicianId) => {
      const previousTechnicianId = complaintQuery.data?.technician?.id;
      await invalidateTechnicianAssignment(queryClient);
      await recordAudit(
        adminAuditEvents.complaintAssignment(
          complaintId,
          technicianId,
          assignment.workOrder.id,
          previousTechnicianId,
        ),
      );
    },
  });
  const statusMutation = useMutation({
    mutationFn: (status: AdminComplaintStatus) =>
      runProtectedAdminAction(
        adminActionPermissions.changeComplaintStatus(),
        'change complaint status',
        'complaints',
        () => complaintsService.updateStatus({ complaintId, status }),
      ),
    onSuccess: async (complaint, status) => {
      await synchronizeComplaint();
      const technicianId = complaintQuery.data?.technician?.id;
      if (status === 'resolved' && technicianId) {
        await invalidateTechnicianWorkOrder(
          queryClient,
          technicianId,
          complaintId,
        );
      }
      await recordAudit(
        adminAuditEvents.complaintStatusChanged(complaint.id, status),
      );
    },
  });
  const replyMutation = useMutation({
    mutationFn: (reply: string) =>
      runProtectedAdminAction(
        adminActionPermissions.replyToComplaint(),
        'reply to complaint',
        'complaints',
        () => complaintsService.reply({ complaintId, reply }),
      ),
    onSuccess: async complaint => {
      await synchronizeComplaint();
      await recordAudit(
        adminAuditEvents.complaintReplied(complaint.id, complaint.status),
      );
    },
  });

  const confirmAssignment = (technicianId: string) => {
    const technician = techniciansQuery.data?.find(
      item => item.id === technicianId,
    );
    if (!technician || technician.id === complaintQuery.data?.technician?.id)
      return;
    const reassigning = Boolean(complaintQuery.data?.technician);
    const confirmation = createAdminConfirmation({
      actionName: reassigning ? 'Reassign technician' : 'Assign technician',
      affectedEntity: `complaint ${complaintId} and technician ${technician.name}`,
      confirmLabel: reassigning ? 'Reassign' : 'Assign',
      destructive: reassigning,
      onConfirm: () => assignMutation.mutate(technicianId),
    });
    Alert.alert(confirmation.title, confirmation.message, confirmation.buttons);
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
        <AdminDetailSkeleton
          label="Loading complaint details"
          rows={[3, 4, 4]}
        />
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
  topCard: { marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
