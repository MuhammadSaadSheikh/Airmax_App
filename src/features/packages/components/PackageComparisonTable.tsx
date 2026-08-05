import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SecondaryButton, Surface } from '@/components';
import type { PackageComparison } from '@/services/packages';
import { colors, spacing, typography } from '@/theme';

function PackageComparisonTableComponent({ comparison, onChoose }: { comparison: PackageComparison; onChoose: (id: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    <Surface style={styles.table}>
      <View style={styles.row}><View style={styles.labelCell}><AppText style={styles.heading}>FEATURE</AppText></View>{comparison.packages.map(plan => <View key={plan.id} style={styles.planCell}><AppText style={styles.planName}>{plan.name.replace('AIRMAX ', '')}</AppText></View>)}</View>
      {comparison.comparisonFeatures.map(feature => <View key={feature.key} style={styles.row}><View style={styles.labelCell}><AppText style={styles.label}>{feature.label}</AppText></View>{comparison.packages.map(plan => <View key={plan.id} style={styles.planCell}><AppText style={styles.value}>{feature.values[plan.id] ?? '—'}</AppText></View>)}</View>)}
      <View style={styles.row}><View style={styles.labelCell} />{comparison.packages.map(plan => <View key={plan.id} style={styles.planCell}><SecondaryButton title="Choose" onPress={() => onChoose(plan.id)} /></View>)}</View>
    </Surface>
  </ScrollView>;
}

export const PackageComparisonTable = memo(PackageComparisonTableComponent);

const cellWidth = spacing.huge * 4;
const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.sm },
  table: { padding: spacing.none, overflow: 'hidden' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  labelCell: { width: cellWidth, padding: spacing.md, justifyContent: 'center', backgroundColor: colors.surface2 },
  planCell: { width: cellWidth, padding: spacing.md, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.border },
  heading: { ...typography.small, color: colors.muted },
  planName: { ...typography.label, color: colors.primary, textAlign: 'center' },
  label: { ...typography.label, color: colors.text },
  value: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
});
