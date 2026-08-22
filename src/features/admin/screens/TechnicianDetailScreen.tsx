import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  Button,
  ErrorState,
} from '@/components';
import { environment } from '@/config/environment';
import {
  AdminDetailSkeleton,
  TechnicianHistoryTimeline,
  TechnicianMockNotice,
  TechnicianProfileCard,
  TechnicianSkillCard,
  TechnicianWorkloadCard,
} from '@/features/admin/components';
import {
  adminActionPermissions,
  createAdminConfirmation,
  runProtectedAdminAction,
} from '@/features/admin/security';
import { useAdminAudit } from '@/features/admin/security/useAdminAudit';
import type { AdminStackParamList } from '@/navigation';
import { complaintsService, techniciansService } from '@/services/api';
import type { TechnicianStatus } from '@/services/api/technicians.models';
import {
  invalidateTechnicianStatus,
  invalidateTechnicianWorkOrder,
  queryKeys,
} from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'TechnicianDetail'>;

export default function TechnicianDetailScreen({ navigation, route }: Props) {
  const id = route.params.id;
  const queryClient = useQueryClient();
  const recordAudit = useAdminAudit();
  const detailQuery = useQuery({
    queryKey: queryKeys.adminTechnicianDetail(id),
    queryFn: () => techniciansService.getTechnicianById(id),
  });
  const workloadQuery = useQuery({
    queryKey: queryKeys.adminTechnicianWorkload(id),
    queryFn: () => techniciansService.getTechnicianWorkload(id),
  });
  const historyQuery = useQuery({
    queryKey: queryKeys.adminTechnicianHistory(id),
    queryFn: () => techniciansService.getTechnicianHistory(id),
  });
  const complaintsQuery = useQuery({
    queryKey: queryKeys.adminComplaintList,
    queryFn: complaintsService.list,
  });
  const statusMutation = useMutation({
    mutationFn: (status: TechnicianStatus) =>
      techniciansService.updateTechnicianStatus({ id, status }),
    onSuccess: () => invalidateTechnicianStatus(queryClient, id),
  });
  const lifecycleMutation = useMutation({
    mutationFn: ({
      action,
      workOrderId,
    }: {
      action: 'accept' | 'start' | 'complete' | 'cancel';
      workOrderId: string;
    }) => {
      return runProtectedAdminAction(
        adminActionPermissions.changeWorkOrder(),
        `${action} work order`,
        'technicians',
        () => {
          if (action === 'accept')
            return techniciansService.acceptWorkOrder(workOrderId);
          if (action === 'start')
            return techniciansService.startWorkOrder(workOrderId);
          if (action === 'complete')
            return techniciansService.completeWorkOrder(workOrderId);
          return techniciansService.cancelWorkOrder(workOrderId);
        },
      );
    },
    onSuccess: async (assignment, variables) => {
      await invalidateTechnicianWorkOrder(
        queryClient,
        assignment.technicianId,
        assignment.complaintId,
      );
      const auditAction = {
        accept: 'WORK_ORDER_ACCEPTED',
        start: 'WORK_ORDER_STARTED',
        complete: 'WORK_ORDER_COMPLETED',
        cancel: 'WORK_ORDER_CANCELLED',
      } as const;
      await recordAudit({
        action: auditAction[variables.action],
        entityType: 'WORK_ORDER',
        entityId: assignment.workOrder.id,
        metadata: {
          complaintId: assignment.complaintId,
          technicianId: assignment.technicianId,
          status: assignment.workOrder.status,
        },
      });
    },
  });

  if (
    detailQuery.isPending ||
    workloadQuery.isPending ||
    historyQuery.isPending
  ) {
    return (
      <AppScreen>
        <AppHeader title="Technician details" showBack />
        <AdminDetailSkeleton
          label="Loading technician details"
          rows={[4, 3, 4]}
        />
      </AppScreen>
    );
  }
  if (detailQuery.isError || workloadQuery.isError || historyQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Technician details" showBack />
        <ErrorState
          title="Technician unavailable"
          message="This field service record could not be loaded."
          retry={() => {
            void detailQuery.refetch();
            void workloadQuery.refetch();
            void historyQuery.refetch();
          }}
        />
      </AppScreen>
    );
  }

  const technician = detailQuery.data;
  const unassignedComplaint = complaintsQuery.data?.find(
    complaint =>
      complaint.status === 'pending' && complaint.technician === null,
  );
  const activeAssignment = workloadQuery.data.assignments.find(item =>
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(item.workOrder.status),
  );
  const confirmLifecycle = (
    lifecycleAction: 'accept' | 'start' | 'complete' | 'cancel',
    label: string,
  ) => {
    if (!activeAssignment) return;
    const confirmation = createAdminConfirmation({
      actionName: label,
      affectedEntity: `work order ${activeAssignment.workOrder.id} for complaint ${activeAssignment.complaintId}`,
      confirmLabel: label,
      destructive:
        lifecycleAction === 'cancel' || lifecycleAction === 'complete',
      onConfirm: () =>
        lifecycleMutation.mutate({
          action: lifecycleAction,
          workOrderId: activeAssignment.workOrder.id,
        }),
    });
    Alert.alert(confirmation.title, confirmation.message, confirmation.buttons);
  };
  const action =
    technician.status === 'AVAILABLE'
      ? {
          title: unassignedComplaint
            ? `Assign ticket #${unassignedComplaint.ticketNumber}`
            : 'No pending complaint to assign',
          disabled: !unassignedComplaint,
          onPress: unassignedComplaint
            ? () =>
                navigation.navigate('TechnicianAssignment', {
                  complaintId: unassignedComplaint.id,
                })
            : undefined,
        }
      : technician.status === 'BUSY' && activeAssignment
        ? {
            title: 'View active complaint',
            disabled: false,
            onPress: () =>
              navigation.navigate('ComplaintDetail', {
                id: activeAssignment.complaintId,
              }),
          }
        : {
            title: 'Assignment unavailable while offline',
            disabled: true,
            onPress: undefined,
          };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title={technician.name}
        subtitle="Technician details"
        showBack
      />
      {environment.useMockApi ? <TechnicianMockNotice /> : null}
      <View style={styles.top}>
        <TechnicianProfileCard technician={technician} />
      </View>
      <SectionTitle title="Assignment action" />
      <Button
        title={action.title}
        icon="briefcase-outline"
        disabled={action.disabled}
        onPress={action.onPress}
      />
      <SectionTitle title="Availability controls" />
      <View style={styles.actions}>
        {technician.status !== 'AVAILABLE' ? (
          <Button
            title="Mark available"
            variant="secondary"
            disabled={workloadQuery.data.activeJobs > 0}
            loading={statusMutation.isPending}
            onPress={() => statusMutation.mutate('AVAILABLE')}
          />
        ) : null}
        {technician.status !== 'OFFLINE' ? (
          <Button
            title="Mark offline"
            variant="secondary"
            loading={statusMutation.isPending}
            onPress={() => statusMutation.mutate('OFFLINE')}
          />
        ) : null}
        {technician.status !== 'ON_LEAVE' ? (
          <Button
            title="Place on leave"
            variant="secondary"
            loading={statusMutation.isPending}
            onPress={() => statusMutation.mutate('ON_LEAVE')}
          />
        ) : null}
      </View>
      {statusMutation.error ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {statusMutation.error instanceof Error
            ? statusMutation.error.message
            : 'Status could not be updated.'}
        </AppText>
      ) : null}
      <SectionTitle title="Skills" />
      <View style={styles.skills}>
        {technician.skills.map(skill => (
          <TechnicianSkillCard key={skill.id} skill={skill} />
        ))}
      </View>
      <SectionTitle title="Workload" />
      <TechnicianWorkloadCard workload={workloadQuery.data} />
      {activeAssignment ? (
        <>
          <SectionTitle title="Work order lifecycle" />
          <View style={styles.actions}>
            {activeAssignment.workOrder.status === 'ASSIGNED' ? (
              <Button
                title="Accept work order"
                icon="checkmark-circle-outline"
                loading={lifecycleMutation.isPending}
                onPress={() => confirmLifecycle('accept', 'Accept work order')}
              />
            ) : null}
            {activeAssignment.workOrder.status === 'ACCEPTED' ? (
              <Button
                title="Start work"
                icon="play-circle-outline"
                loading={lifecycleMutation.isPending}
                onPress={() => confirmLifecycle('start', 'Start work order')}
              />
            ) : null}
            {activeAssignment.workOrder.status === 'IN_PROGRESS' ? (
              <Button
                title="Complete work order"
                icon="checkmark-done-outline"
                loading={lifecycleMutation.isPending}
                onPress={() =>
                  confirmLifecycle('complete', 'Complete work order')
                }
              />
            ) : null}
            <Button
              title="Cancel work order"
              icon="close-circle-outline"
              variant="danger"
              loading={lifecycleMutation.isPending}
              onPress={() => confirmLifecycle('cancel', 'Cancel work order')}
            />
          </View>
          {lifecycleMutation.error ? (
            <AppText accessibilityRole="alert" style={styles.error}>
              {lifecycleMutation.error instanceof Error
                ? lifecycleMutation.error.message
                : 'Work order could not be updated.'}
            </AppText>
          ) : null}
        </>
      ) : null}
      <SectionTitle title="History" />
      <TechnicianHistoryTimeline history={historyQuery.data} />
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}
const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  top: { marginTop: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  actions: { gap: spacing.sm },
  skills: { gap: spacing.md },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
