import { StyleSheet } from 'react-native';
import { AppText, Button, Surface } from '@/components';
import type { AdminComplaintStatus } from '@/services/api/complaints.models';
import { colors, spacing, typography } from '@/theme';

const nextStatus: Partial<Record<AdminComplaintStatus, AdminComplaintStatus>> =
  {
    assigned: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
  };

const actionCopy: Partial<
  Record<
    AdminComplaintStatus,
    {
      title: string;
      icon: 'play-outline' | 'checkmark-done-outline' | 'lock-closed-outline';
    }
  >
> = {
  assigned: { title: 'Start work', icon: 'play-outline' },
  in_progress: { title: 'Resolve complaint', icon: 'checkmark-done-outline' },
  resolved: { title: 'Close complaint', icon: 'lock-closed-outline' },
};

export function ComplaintActionPanel({
  status,
  loading,
  onStatusChange,
}: {
  status: AdminComplaintStatus;
  loading: boolean;
  onStatusChange: (status: AdminComplaintStatus) => void;
}) {
  const target = nextStatus[status];
  const copy = actionCopy[status];

  return (
    <Surface disabled={status === 'closed'}>
      {status === 'pending' ? (
        <AppText style={styles.help}>
          Assign a technician to move this complaint into the workflow.
        </AppText>
      ) : status === 'closed' ? (
        <AppText style={styles.help}>
          This complaint is closed and cannot be modified.
        </AppText>
      ) : target && copy ? (
        <>
          <AppText style={styles.help}>
            Status changes follow the approved sequence and cannot move
            backward.
          </AppText>
          <Button
            title={copy.title}
            icon={copy.icon}
            variant={target === 'closed' ? 'danger' : 'primary'}
            loading={loading}
            onPress={() => onStatusChange(target)}
          />
        </>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  help: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
