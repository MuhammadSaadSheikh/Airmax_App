import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type { CustomerStatusFilter } from '@/services/api/customers.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const filters: ReadonlyArray<{ value: CustomerStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'disabled', label: 'Disabled' },
];

export function CustomerFilterBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: CustomerStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CustomerStatusFilter) => void;
}) {
  return (
    <View style={styles.container}>
      <SearchField
        accessibilityLabel="Search customers"
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search name, phone or connection ID"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map(filter => {
          const selected = status === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityLabel={`Filter customers by ${filter.label}`}
              accessibilityState={{ selected }}
              onPress={() => onStatusChange(filter.value)}
              style={({ pressed }) => [
                styles.filter,
                selected && styles.selectedFilter,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[styles.filterLabel, selected && styles.selectedLabel]}
              >
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
  selectedFilter: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: animation.opacity.pressed },
  filterLabel: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.textOnAccent },
});
