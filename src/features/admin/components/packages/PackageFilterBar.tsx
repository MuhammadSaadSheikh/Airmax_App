import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type { PackageStatusFilter } from '@/services/api/packages.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const filters: ReadonlyArray<{ value: PackageStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function PackageFilterBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: PackageStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: PackageStatusFilter) => void;
}) {
  return (
    <View style={styles.container}>
      <SearchField
        accessibilityLabel="Search packages"
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search name, speed or feature"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map(filter => {
          const selected = filter.value === status;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityLabel={`Filter packages by ${filter.label}`}
              accessibilityState={{ selected }}
              onPress={() => onStatusChange(filter.value)}
              style={({ pressed }) => [
                styles.filter,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={[styles.label, selected && styles.selectedLabel]}>
                {filter.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  filters: { gap: spacing.sm, paddingRight: spacing.lg },
  filter: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary },
  pressed: { opacity: animation.opacity.pressed },
  label: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.primary },
});
