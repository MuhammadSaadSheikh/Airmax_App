import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  Button,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { environment } from '@/config/environment';
import {
  TechnicianHistoryTimeline,
  TechnicianMockNotice,
  TechnicianProfileCard,
  TechnicianSkillCard,
  TechnicianWorkloadCard,
} from '@/features/admin/components';
import type { AdminStackParamList } from '@/navigation';
import { complaintsService, techniciansService } from '@/services/api';
import type { TechnicianStatus } from '@/services/api/technicians.models';
import { invalidateTechnicianStatus, queryKeys } from '@/services/query';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'TechnicianDetail'>;

export default function TechnicianDetailScreen({ navigation, route }: Props) {
  const id = route.params.id;
  const queryClient = useQueryClient();
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

  if (
    detailQuery.isPending ||
    workloadQuery.isPending ||
    historyQuery.isPending
  ) {
    return (
      <AppScreen>
        <AppHeader title="Technician details" showBack />
        <View style={styles.loading}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </View>
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
  loading: { gap: spacing.lg },
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
