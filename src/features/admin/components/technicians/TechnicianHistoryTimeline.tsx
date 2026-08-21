import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { TechnicianHistory } from '@/services/api/technicians.models';
import { colors, radius, spacing, typography } from '@/theme';

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function TechnicianHistoryTimeline({
  history,
}: {
  history: TechnicianHistory[];
}) {
  return (
    <Surface>
      {history.length === 0 ? (
        <AppText style={styles.empty}>No technician activity recorded.</AppText>
      ) : (
        history.map((item, index) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.markerColumn}>
              <View style={styles.marker}>
                <AppIcon
                  name="construct"
                  size={12}
                  color={colors.textOnAccent}
                />
              </View>
              {index < history.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View
              style={[
                styles.copy,
                index < history.length - 1 && styles.spacing,
              ]}
            >
              <AppText style={styles.action}>
                {item.action.replaceAll('_', ' ')}
              </AppText>
              <AppText style={styles.note}>{item.note}</AppText>
              {item.complaintId ? (
                <AppText style={styles.meta}>{item.complaintId}</AppText>
              ) : null}
              <AppText style={styles.meta}>
                {displayDate(item.createdAt)}
              </AppText>
            </View>
          </View>
        ))
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.md },
  markerColumn: { width: 24, alignItems: 'center' },
  marker: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  copy: { flex: 1 },
  spacing: { paddingBottom: spacing.lg },
  action: { ...typography.label, color: colors.text },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  meta: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  empty: { ...typography.body, color: colors.textSecondary },
});
