import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type {
  AdminComplaint,
  AdminTechnicianOption,
} from '@/services/api/complaints.models';
import { colors, spacing, typography } from '@/theme';
import { TechnicianOption } from './TechnicianOption';

export function ComplaintAssignmentCard({
  complaint,
  technicians,
  loading,
  onAssign,
}: {
  complaint: AdminComplaint;
  technicians: AdminTechnicianOption[];
  loading: boolean;
  onAssign: (technicianId: string) => void;
}) {
  const locked = complaint.status === 'closed';
  return (
    <Surface disabled={locked}>
      <AppText style={styles.title}>
        {complaint.technician ? 'Assigned technician' : 'Choose technician'}
      </AppText>
      <AppText style={styles.help}>
        Assignment moves a pending ticket to assigned. Reassignment preserves
        later workflow status.
      </AppText>
      <View style={styles.options}>
        {loading && technicians.length === 0 ? (
          <AppText style={styles.help}>Loading technician options…</AppText>
        ) : technicians.length === 0 ? (
          <AppText style={styles.help}>No technicians are available.</AppText>
        ) : (
          technicians.map(technician => (
            <TechnicianOption
              key={technician.id}
              technician={technician}
              selected={complaint.technician?.id === technician.id}
              disabled={
                locked ||
                loading ||
                (technician.status !== 'available' &&
                  complaint.technician?.id !== technician.id)
              }
              onPress={() => onAssign(technician.id)}
            />
          ))
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.sectionTitle, color: colors.text },
  help: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  options: { gap: spacing.sm, marginTop: spacing.md },
});
