import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type { ComplaintStatusFilter } from '@/services/api/complaints.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const filters: ReadonlyArray<{
  value: ComplaintStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export function ComplaintFilterBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: ComplaintStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ComplaintStatusFilter) => void;
}) {
  return (
    <View style={styles.container}>
      <SearchField
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search ticket, customer, connection or category"
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
  },
  selectedFilter: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: animation.opacity.pressed },
  filterLabel: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.textOnAccent },
});
