import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  Button,
  ErrorState,
  Row,
  Surface,
} from '@/components';
import { environment } from '@/config/environment';
import {
  AdminDetailSkeleton,
  TechnicianAssignmentCard,
  TechnicianMockNotice,
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
import { invalidateTechnicianAssignment, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<
  AdminStackParamList,
  'TechnicianAssignment'
>;

export default function TechnicianAssignmentScreen({
  navigation,
  route,
}: Props) {
  const complaintId = route.params.complaintId;
  const queryClient = useQueryClient();
  const recordAudit = useAdminAudit();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const complaintQuery = useQuery({
    queryKey: queryKeys.adminComplaintDetail(complaintId),
    queryFn: () => complaintsService.getById(complaintId),
  });
  const techniciansQuery = useQuery({
    queryKey: [
      ...queryKeys.adminTechnicianList,
      { status: 'AVAILABLE' },
    ] as const,
    queryFn: () => techniciansService.getAvailableTechnicians(),
  });
  const assignmentMutation = useMutation({
    mutationFn: async (technicianId: string) => {
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
      navigation.goBack();
    },
  });

  if (complaintQuery.isPending || techniciansQuery.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Assign technician" showBack />
        <AdminDetailSkeleton
          label="Loading technician assignment"
          rows={[4, 3, 3]}
        />
      </AppScreen>
    );
  }
  if (complaintQuery.isError || techniciansQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Assign technician" showBack />
        <ErrorState
          title="Assignment unavailable"
          message="Complaint or technician data could not be loaded."
          retry={() => {
            void complaintQuery.refetch();
            void techniciansQuery.refetch();
          }}
        />
      </AppScreen>
    );
  }

  const complaint = complaintQuery.data;
  const confirmAssignment = () => {
    if (!selectedId) return;
    const technician = techniciansQuery.data.find(
      item => item.id === selectedId,
    );
    if (!technician) return;
    const reassigning = Boolean(complaint.technician);
    const confirmation = createAdminConfirmation({
      actionName: reassigning ? 'Reassign complaint' : 'Assign complaint',
      affectedEntity: `ticket #${complaint.ticketNumber} and technician ${technician.name}`,
      confirmLabel: reassigning ? 'Reassign' : 'Assign',
      destructive: reassigning,
      onConfirm: () => assignmentMutation.mutate(selectedId),
    });
    Alert.alert(confirmation.title, confirmation.message, confirmation.buttons);
  };
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Assign technician"
        subtitle={`Ticket #${complaint.ticketNumber}`}
        showBack
      />
      {environment.useMockApi ? <TechnicianMockNotice /> : null}
      <SectionTitle title="Complaint information" />
      <Surface>
        <Row
          icon="alert-circle-outline"
          title={complaint.category}
          subtitle={complaint.description}
        />
        <View style={styles.rowSpacing}>
          <Row
            icon="pulse-outline"
            title="Status"
            subtitle={complaint.status.replaceAll('_', ' ')}
          />
        </View>
      </Surface>
      <SectionTitle title="Customer information" />
      <Surface>
        <Row
          icon="person-outline"
          title={complaint.customer.name}
          subtitle={complaint.customer.connectionId ?? 'Connection pending'}
        />
        <View style={styles.rowSpacing}>
          <Row
            icon="call-outline"
            title="Phone"
            subtitle={complaint.customer.phone}
          />
        </View>
      </Surface>
      <SectionTitle title="Available technicians" />
      {techniciansQuery.data.length === 0 ? (
        <Surface>
          <AppText style={styles.empty}>
            No technicians are currently available.
          </AppText>
        </Surface>
      ) : (
        <View style={styles.technicians}>
          {techniciansQuery.data.map(technician => (
            <TechnicianAssignmentCard
              key={technician.id}
              technician={technician}
              selected={selectedId === technician.id}
              disabled={assignmentMutation.isPending}
              onPress={() => setSelectedId(technician.id)}
            />
          ))}
        </View>
      )}
      <Button
        title={complaint.technician ? 'Reassign complaint' : 'Assign complaint'}
        icon="checkmark-circle-outline"
        disabled={!selectedId}
        loading={assignmentMutation.isPending}
        onPress={confirmAssignment}
      />
      {assignmentMutation.error ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {assignmentMutation.error instanceof Error
            ? assignmentMutation.error.message
            : 'Assignment could not be completed.'}
        </AppText>
      ) : null}
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}
const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  rowSpacing: { marginTop: spacing.lg },
  technicians: { gap: spacing.md },
  empty: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
});
