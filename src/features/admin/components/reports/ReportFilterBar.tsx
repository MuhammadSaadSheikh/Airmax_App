import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SecondaryButton, TextField } from '@/components';
import type { ReportRangePreset } from '@/features/admin/reports.filters';
import type { ReportFilterOption } from '@/services/api/reports.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const options: Array<{ id: ReportRangePreset; label: string }> = [
  { id: 'current_month', label: 'This month' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'all_time', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

export function ReportFilterBar({
  value,
  onChange,
  customFrom,
  customTo,
  customError,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustom,
}: {
  value: ReportRangePreset;
  onChange: (value: ReportRangePreset) => void;
  customFrom?: string;
  customTo?: string;
  customError?: string;
  onCustomFromChange?: (value: string) => void;
  onCustomToChange?: (value: string) => void;
  onApplyCustom?: () => void;
}) {
  return (
    <View>
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
      {value === 'custom' ? (
        <View style={styles.custom}>
          <TextField
            label="From date"
            value={customFrom}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            onChangeText={onCustomFromChange}
          />
          <TextField
            label="To date"
            value={customTo}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            error={customError}
            onChangeText={onCustomToChange}
          />
          <SecondaryButton
            title="Apply dates"
            icon="calendar-outline"
            onPress={onApplyCustom}
          />
        </View>
      ) : null}
    </View>
  );
}

export function ReportFilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReportFilterOption[];
  value?: string;
  onChange: (value?: string) => void;
}) {
  return (
    <View style={styles.chipSection}>
      <AppText style={styles.chipTitle}>{label}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {[{ id: '', label: 'All' }, ...options].map(option => {
          const selected = (value ?? '') === option.id;
          return (
            <Pressable
              key={option.id || 'all'}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id || undefined)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingBottom: spacing.lg },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
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
  custom: { marginBottom: spacing.lg },
  chipSection: { marginBottom: spacing.md },
  chipTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
