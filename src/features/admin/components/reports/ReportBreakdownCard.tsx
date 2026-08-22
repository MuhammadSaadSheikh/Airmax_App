import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type { ReportBreakdownItem } from '@/services/api/reports.models';
import { colors, spacing, typography } from '@/theme';

function labelFor(id: string): string {
  return id
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function ReportBreakdownCard({
  title,
  items,
  formatValue = value => value.toLocaleString('en-PK'),
}: {
  title: string;
  items: ReportBreakdownItem[];
  formatValue?: (value: number) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <Surface style={styles.card} accessibilityLabel={title}>
      <AppText style={styles.title}>{title}</AppText>
      {items.length === 0 ? (
        <AppText style={styles.empty}>
          No breakdown data for this period.
        </AppText>
      ) : (
        items.map(item => (
          <View key={item.id} style={styles.row}>
            <View style={styles.nameRow}>
              <View style={styles.dot} />
              <AppText style={styles.label}>{labelFor(item.id)}</AppText>
            </View>
            <AppText style={styles.value}>
              {formatValue(item.value)}
              {total > 0 ? ` · ${Math.round((item.value / total) * 100)}%` : ''}
            </AppText>
          </View>
        ))
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  title: { ...typography.sectionTitle, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  label: { ...typography.body, color: colors.textSecondary, flex: 1 },
  value: { ...typography.label, color: colors.text },
  empty: { ...typography.body, color: colors.muted },
});
