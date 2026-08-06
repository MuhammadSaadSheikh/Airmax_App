import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
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
import { queryKeys } from '@/services/query';
import { supportService } from '@/services/support';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ComplaintDetail'>;

export default function ComplaintDetailScreen({ route }: Props) {
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const query = useQuery({
    queryKey: queryKeys.supportComplaintDetail(connectionId, route.params.id),
    queryFn: () =>
      supportService.getComplaintDetail(connectionId, route.params.id),
  });

  if (query.isPending) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <AppHeader title="Complaint detail" showBack />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </AppScreen>
    );
  }
  if (query.isError || !query.data) {
    return (
      <AppScreen>
        <AppHeader title="Complaint detail" showBack />
        <ErrorState
          title="Ticket not found"
          message="This complaint may no longer be available."
          retry={() => void query.refetch()}
        />
      </AppScreen>
    );
  }

  const complaint = query.data;
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
      {complaint.technician ? (
        <>
          <AppText style={styles.sectionTitle}>Technician status</AppText>
          <TechnicianCard assignment={complaint.technician} />
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
