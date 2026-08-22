import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/components';
import type { ReportRangePreset } from '@/features/admin/reports.filters';
import { animation, colors, radius, spacing, typography } from '@/theme';

const options: Array<{ id: ReportRangePreset; label: string }> = [
  { id: 'current_month', label: 'This month' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'all_time', label: 'All time' },
];

export function ReportFilterBar({
  value,
  onChange,
}: {
  value: ReportRangePreset;
  onChange: (value: ReportRangePreset) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
      accessibilityRole="radiogroup"
    >
      {options.map(option => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={`Report period: ${option.label}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingBottom: spacing.lg },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  label: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.primary },
  pressed: { opacity: animation.opacity.pressed },
});
