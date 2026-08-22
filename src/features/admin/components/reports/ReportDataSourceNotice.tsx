import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { ReportMetadata } from '@/services/api/reports.models';
import { colors, spacing, typography } from '@/theme';

export function ReportDataSourceNotice({
  metadata,
}: {
  metadata: ReportMetadata;
}) {
  const asOf = new Date(metadata.asOf).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return (
    <Surface style={styles.notice} accessibilityRole="summary">
      <AppIcon name="information-circle-outline" color={colors.primary} />
      <View style={styles.copy}>
        <AppText style={styles.title}>
          {metadata.source === 'mock'
            ? 'Mock reporting snapshot'
            : 'Reporting snapshot'}
        </AppText>
        <AppText style={styles.detail}>
          As of {asOf} · {metadata.timezone} · {metadata.currency}
        </AppText>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceAccent,
  },
  copy: { flex: 1 },
  title: { ...typography.label, color: colors.text },
  detail: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
});
