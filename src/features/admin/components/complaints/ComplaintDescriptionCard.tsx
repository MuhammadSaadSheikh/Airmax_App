import { StyleSheet } from 'react-native';
import { AppText, Divider, Row, Surface } from '@/components';
import type { AdminComplaint } from '@/services/api/complaints.models';
import { colors, spacing, typography } from '@/theme';

export function ComplaintDescriptionCard({
  complaint,
}: {
  complaint: AdminComplaint;
}) {
  return (
    <Surface>
      <AppText style={styles.description}>{complaint.description}</AppText>
      <Divider />
      <Row
        icon="attach-outline"
        title="Customer attachment"
        subtitle={
          complaint.attachmentUrl
            ? 'Attachment recorded (informational only)'
            : 'No attachment provided'
        }
      />
      {complaint.attachmentUrl ? (
        <AppText numberOfLines={1} style={styles.reference}>
          {complaint.attachmentUrl}
        </AppText>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  description: { ...typography.bodyLarge, color: colors.text, lineHeight: 25 },
  reference: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
    marginLeft: 56,
  },
});
